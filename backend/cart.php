<?php
declare(strict_types=1);
require __DIR__ . '/config.php';

$pdo = db();
$sessionId = current_session_id();

function ensure_cart(PDO $pdo, string $sessionId): int {
    $stmt = $pdo->prepare('SELECT id FROM carts WHERE session_id = ?');
    $stmt->execute([$sessionId]);
    $id = $stmt->fetchColumn();
    if ($id) return (int)$id;
    $stmt = $pdo->prepare('INSERT INTO carts (session_id) VALUES (?)');
    $stmt->execute([$sessionId]);
    return (int)$pdo->lastInsertId();
}

function cart_totals(PDO $pdo, int $cartId): array {
    $stmt = $pdo->prepare('SELECT SUM(qty * price_cents) FROM cart_items WHERE cart_id = ?');
    $stmt->execute([$cartId]);
    $subtotal = (int)($stmt->fetchColumn() ?: 0);
    return [
        'subtotal_cents' => $subtotal,
        'total_cents' => $subtotal,
        'subtotal_brl' => cents_to_brl($subtotal),
        'total_brl' => cents_to_brl($subtotal),
    ];
}

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
if ($method === 'GET') {
    $cartId = ensure_cart($pdo, $sessionId);
    $stmt = $pdo->prepare('SELECT ci.*, p.name, p.image_url FROM cart_items ci JOIN products p ON p.id = ci.product_id WHERE cart_id = ?');
    $stmt->execute([$cartId]);
    $items = $stmt->fetchAll();
    foreach ($items as &$item) {
        $item['price_brl'] = cents_to_brl((int)$item['price_cents']);
        $item['total_cents'] = (int)$item['price_cents'] * (int)$item['qty'];
        $item['total_brl'] = cents_to_brl($item['total_cents']);
    }
    $totals = cart_totals($pdo, $cartId);
    json_response(['cart_id' => $cartId, 'items' => $items, 'totals' => $totals]);
}

if ($method === 'POST') {
    $payload = json_decode(file_get_contents('php://input'), true) ?: $_POST;
    $action = $payload['action'] ?? '';
    $cartId = ensure_cart($pdo, $sessionId);
    if ($action === 'add') {
        $productId = (int)($payload['product_id'] ?? 0);
        $qty = max(1, (int)($payload['qty'] ?? 1));
        $stmt = $pdo->prepare('SELECT id, price_cents FROM products WHERE id = ?');
        $stmt->execute([$productId]);
        $product = $stmt->fetch();
        if (!$product) json_response(['error' => 'Produto inválido'], 400);
        $stmt = $pdo->prepare('INSERT INTO cart_items (cart_id, product_id, qty, price_cents) VALUES (?,?,?,?) ON DUPLICATE KEY UPDATE qty = qty + VALUES(qty), price_cents = VALUES(price_cents)');
        $stmt->execute([$cartId, $productId, $qty, (int)$product['price_cents']]);
        json_response(['ok' => true] + cart_totals($pdo, $cartId));
    }
    if ($action === 'update') {
        $productId = (int)($payload['product_id'] ?? 0);
        $qty = max(0, (int)($payload['qty'] ?? 1));
        if ($qty === 0) {
            $stmt = $pdo->prepare('DELETE FROM cart_items WHERE cart_id=? AND product_id=?');
            $stmt->execute([$cartId, $productId]);
            json_response(['ok' => true] + cart_totals($pdo, $cartId));
        }
        $stmt = $pdo->prepare('UPDATE cart_items SET qty=? WHERE cart_id=? AND product_id=?');
        $stmt->execute([$qty, $cartId, $productId]);
        json_response(['ok' => true] + cart_totals($pdo, $cartId));
    }
    if ($action === 'clear') {
        $stmt = $pdo->prepare('DELETE FROM cart_items WHERE cart_id=?');
        $stmt->execute([$cartId]);
        json_response(['ok' => true] + cart_totals($pdo, $cartId));
    }
    json_response(['error' => 'Ação inválida'], 400);
}

http_response_code(405);
?>

