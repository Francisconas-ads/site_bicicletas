<?php
declare(strict_types=1);
require __DIR__ . '/config.php';

// Simple HTML to PDF using Dompdf (CDN-less install is not available here). As a fallback, output HTML with proper print styles.
// If Dompdf is available (via Composer), we use it; otherwise, return printable HTML.

$pdo = db();

$number = $_GET['number'] ?? '';
if ($number === '') {
    http_response_code(400);
    echo 'Número não informado';
    exit;
}

$stmt = $pdo->prepare('SELECT o.*, c.nome, c.email, c.cpf_cnpj, c.telefone, c.cep, c.endereco, c.numero, c.complemento, c.bairro, c.cidade, c.uf FROM orders o LEFT JOIN customers c ON c.id = o.customer_id WHERE o.order_number = ?');
$stmt->execute([$number]);
$order = $stmt->fetch();
if (!$order) { http_response_code(404); echo 'Documento não encontrado'; exit; }

$items = $pdo->prepare('SELECT * FROM order_items WHERE order_id = ?');
$items->execute([(int)$order['id']]);
$items = $items->fetchAll();

$title = $order['type'] === 'PEDIDO' ? 'Pedido de Compra' : 'Orçamento';
$date = date('d/m/Y H:i');
$total = cents_to_brl((int)$order['total_cents']);

ob_start();
?>
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="utf-8" />
    <title><?= htmlspecialchars($title) ?> <?= htmlspecialchars($order['order_number']) ?></title>
    <style>
        body { font-family: DejaVu Sans, Arial, sans-serif; color: #333; }
        h1 { font-size: 20px; margin: 0 0 10px; }
        .meta, .customer { margin-bottom: 12px; font-size: 12px; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th, td { border: 1px solid #ccc; padding: 6px 8px; font-size: 12px; }
        th { background: #f6f6f6; text-align: left; }
        .totals { text-align: right; margin-top: 10px; font-weight: bold; }
        @media print { .no-print { display: none; } }
    </style>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <meta name="format-detection" content="telephone=no" />
    <meta name="format-detection" content="date=no" />
    <meta name="format-detection" content="address=no" />
</head>
<body>
    <div class="no-print" style="margin-bottom:10px;">
        <button onclick="window.print()">Imprimir</button>
    </div>
    <h1><?= htmlspecialchars($title) ?> - <?= htmlspecialchars($order['order_number']) ?></h1>
    <div class="meta">Emissão: <?= $date ?></div>
    <div class="customer">
        <strong>Cliente:</strong> <?= htmlspecialchars($order['nome'] ?: 'Não informado') ?><br />
        <strong>CPF/CNPJ:</strong> <?= htmlspecialchars($order['cpf_cnpj'] ?: '-') ?>
        <strong>Telefone:</strong> <?= htmlspecialchars($order['telefone'] ?: '-') ?><br />
        <strong>Endereço:</strong> <?= htmlspecialchars(trim(($order['endereco'] ?: '') . ', ' . ($order['numero'] ?: '') . ' - ' . ($order['bairro'] ?: '') . ' - ' . ($order['cidade'] ?: '') . '/' . ($order['uf'] ?: ''))) ?><br />
        <strong>CEP:</strong> <?= htmlspecialchars($order['cep'] ?: '-') ?>
    </div>
    <table>
        <thead>
            <tr>
                <th>Produto</th>
                <th>Qtd</th>
                <th>Preço</th>
                <th>Total</th>
            </tr>
        </thead>
        <tbody>
            <?php foreach ($items as $it): ?>
            <tr>
                <td><?= htmlspecialchars($it['name']) ?></td>
                <td><?= (int)$it['qty'] ?></td>
                <td><?= cents_to_brl((int)$it['price_cents']) ?></td>
                <td><?= cents_to_brl((int)$it['total_cents']) ?></td>
            </tr>
            <?php endforeach; ?>
        </tbody>
    </table>
    <div class="totals">Total: <?= $total ?></div>
    <p style="margin-top:12px;font-size:12px;color:#666;">Documento gerado automaticamente por e-Bike Store.</p>
</body>
</html>
<?php
$html = ob_get_clean();

// Try Dompdf if available
if (class_exists('Dompdf\Dompdf')) {
    $dompdf = new Dompdf\Dompdf();
    $dompdf->loadHtml($html, 'UTF-8');
    $dompdf->setPaper('A4');
    $dompdf->render();
    header('Content-Type: application/pdf');
    header('Content-Disposition: inline; filename="' . $order['order_number'] . '.pdf"');
    echo $dompdf->output();
    exit;
}

// Fallback: return printable HTML
header('Content-Type: text/html; charset=utf-8');
echo $html;
?>

