<?php
declare(strict_types=1);
require __DIR__ . '/config.php';

$pdo = db();

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($method === 'GET') {
    $id = isset($_GET['id']) ? (int)$_GET['id'] : null;
    $q = isset($_GET['q']) ? trim((string)$_GET['q']) : '';
    $category = isset($_GET['category']) ? trim((string)$_GET['category']) : '';
    $sort = isset($_GET['sort']) ? (string)$_GET['sort'] : '';

    if ($id) {
        $stmt = $pdo->prepare('SELECT p.*, c.slug as category_slug FROM products p LEFT JOIN categories c ON c.id = p.category_id WHERE p.id = ?');
        $stmt->execute([$id]);
        $product = $stmt->fetch();
        if (!$product) json_response(['error' => 'Produto não encontrado'], 404);
        $product['price_brl'] = cents_to_brl((int)$product['price_cents']);
        json_response($product);
    }

    $sql = 'SELECT p.*, c.slug as category_slug FROM products p LEFT JOIN categories c ON c.id = p.category_id WHERE 1=1';
    $params = [];
    if ($q !== '') {
        $sql .= ' AND (p.name LIKE ? OR p.description LIKE ? OR p.sku LIKE ?)';
        $like = '%' . $q . '%';
        array_push($params, $like, $like, $like);
    }
    if ($category !== '') {
        $sql .= ' AND c.slug = ?';
        $params[] = $category;
    }
    $orderBy = 'p.created_at DESC';
    if ($sort === 'price-asc') $orderBy = 'p.price_cents ASC';
    if ($sort === 'price-desc') $orderBy = 'p.price_cents DESC';
    $sql .= ' ORDER BY ' . $orderBy . ' LIMIT 100';
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $rows = $stmt->fetchAll();
    foreach ($rows as &$row) {
        $row['price_brl'] = cents_to_brl((int)$row['price_cents']);
    }
    json_response(['items' => $rows]);
}

http_response_code(405);
?>

