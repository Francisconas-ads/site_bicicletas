<?php
declare(strict_types=1);
require __DIR__ . '/config.php';

$pdo = db();
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

function next_sequence(PDO $pdo, string $key): string {
    $year = (int)date('Y');
    $pdo->beginTransaction();
    try {
        $stmt = $pdo->prepare('SELECT id, value FROM sequence_counters WHERE seq_key=? AND year=? FOR UPDATE');
        $stmt->execute([$key, $year]);
        $row = $stmt->fetch();
        if ($row) {
            $value = (int)$row['value'] + 1;
            $upd = $pdo->prepare('UPDATE sequence_counters SET value=? WHERE id=?');
            $upd->execute([$value, (int)$row['id']]);
        } else {
            $value = 1;
            $ins = $pdo->prepare('INSERT INTO sequence_counters (seq_key, year, value) VALUES (?,?,?)');
            $ins->execute([$key, $year, $value]);
        }
        $pdo->commit();
        return sprintf('%s-%04d/%d', $key, $value, $year);
    } catch (Throwable $e) {
        $pdo->rollBack();
        throw $e;
    }
}

if ($method === 'POST') {
    $payload = json_decode(file_get_contents('php://input'), true) ?: $_POST;
    $type = strtoupper(trim((string)($payload['type'] ?? 'ORCAMENTO')));
    if (!in_array($type, ['PEDIDO', 'ORCAMENTO'], true)) $type = 'ORCAMENTO';

    // Customer data
    $customer = [
        'nome' => $payload['nome'] ?? '',
        'email' => $payload['email'] ?? '',
        'cpf_cnpj' => $payload['cpf_cnpj'] ?? '',
        'telefone' => $payload['telefone'] ?? '',
        'cep' => $payload['cep'] ?? '',
        'endereco' => $payload['endereco'] ?? '',
        'numero' => $payload['numero'] ?? '',
        'complemento' => $payload['complemento'] ?? '',
        'bairro' => $payload['bairro'] ?? '',
        'cidade' => $payload['cidade'] ?? '',
        'uf' => $payload['uf'] ?? '',
    ];

    $sessionId = current_session_id();
    $stmt = $pdo->prepare('SELECT id FROM carts WHERE session_id = ?');
    $stmt->execute([$sessionId]);
    $cartId = (int)($stmt->fetchColumn() ?: 0);
    if ($cartId === 0) json_response(['error' => 'Carrinho vazio'], 400);
    $stmt = $pdo->prepare('SELECT ci.*, p.name FROM cart_items ci JOIN products p ON p.id = ci.product_id WHERE cart_id = ?');
    $stmt->execute([$cartId]);
    $items = $stmt->fetchAll();
    if (!$items) json_response(['error' => 'Carrinho vazio'], 400);

    $totals = 0;
    foreach ($items as $it) $totals += ((int)$it['qty'] * (int)$it['price_cents']);

    // Upsert customer by email or cpf_cnpj
    $customerId = null;
    if ($customer['email'] !== '') {
        $stmt = $pdo->prepare('SELECT id FROM customers WHERE email = ?');
        $stmt->execute([$customer['email']]);
        $customerId = $stmt->fetchColumn();
    }
    if (!$customerId && $customer['cpf_cnpj'] !== '') {
        $stmt = $pdo->prepare('SELECT id FROM customers WHERE cpf_cnpj = ?');
        $stmt->execute([$customer['cpf_cnpj']]);
        $customerId = $stmt->fetchColumn();
    }
    if ($customerId) {
        $upd = $pdo->prepare('UPDATE customers SET nome=?, telefone=?, cep=?, endereco=?, numero=?, complemento=?, bairro=?, cidade=?, uf=? WHERE id=?');
        $upd->execute([
            $customer['nome'], $customer['telefone'], $customer['cep'], $customer['endereco'], $customer['numero'], $customer['complemento'], $customer['bairro'], $customer['cidade'], $customer['uf'], (int)$customerId
        ]);
    } else {
        $ins = $pdo->prepare('INSERT INTO customers (nome, email, cpf_cnpj, telefone, cep, endereco, numero, complemento, bairro, cidade, uf) VALUES (?,?,?,?,?,?,?,?,?,?,?)');
        $ins->execute([
            $customer['nome'], $customer['email'], $customer['cpf_cnpj'], $customer['telefone'], $customer['cep'], $customer['endereco'], $customer['numero'], $customer['complemento'], $customer['bairro'], $customer['cidade'], $customer['uf']
        ]);
        $customerId = (int)$pdo->lastInsertId();
    }

    $orderNumber = next_sequence($pdo, $type === 'PEDIDO' ? 'PED' : 'ORC');
    $pdo->beginTransaction();
    try {
        $insOrder = $pdo->prepare('INSERT INTO orders (order_number, type, customer_id, subtotal_cents, total_cents, cart_snapshot_json) VALUES (?,?,?,?,?,JSON_OBJECT())');
        $insOrder->execute([$orderNumber, $type, (int)$customerId, $totals, $totals]);
        $orderId = (int)$pdo->lastInsertId();

        $insItem = $pdo->prepare('INSERT INTO order_items (order_id, product_id, name, qty, price_cents, total_cents) VALUES (?,?,?,?,?,?)');
        foreach ($items as $it) {
            $lineTotal = (int)$it['qty'] * (int)$it['price_cents'];
            $insItem->execute([$orderId, (int)$it['product_id'], (string)$it['name'], (int)$it['qty'], (int)$it['price_cents'], $lineTotal]);
        }

        // Clear cart
        $pdo->prepare('DELETE FROM cart_items WHERE cart_id = ?')->execute([$cartId]);

        $pdo->commit();
    } catch (Throwable $e) {
        $pdo->rollBack();
        throw $e;
    }

    json_response(['ok' => true, 'order_number' => $orderNumber, 'total_brl' => cents_to_brl($totals), 'type' => $type]);
}

http_response_code(405);
?>

