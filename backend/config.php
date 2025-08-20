<?php
declare(strict_types=1);

// Basic DB config - adjust env vars in production
$dbHost = getenv('MYSQL_HOST') ?: '127.0.0.1';
$dbPort = (int)(getenv('MYSQL_PORT') ?: '3306');
$dbUser = getenv('MYSQL_USER') ?: 'root';
$dbPass = getenv('MYSQL_PASSWORD') ?: '';
$dbName = getenv('MYSQL_DATABASE') ?: 'ebikestore';

$dsn = "mysql:host={$dbHost};port={$dbPort};dbname={$dbName};charset=utf8mb4";

function db(): PDO {
    static $pdo = null;
    global $dsn, $dbUser, $dbPass;
    if ($pdo === null) {
        $options = [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ];
        $pdo = new PDO($dsn, $dbUser, $dbPass, $options);
    }
    return $pdo;
}

function json_response($data, int $code = 200): void {
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function current_session_id(): string {
    if (session_status() !== PHP_SESSION_ACTIVE) {
        session_start();
    }
    return session_id();
}

function price_to_cents($value): int {
    // Accept string '1.234,56' or float
    if (is_string($value)) {
        $normalized = preg_replace('/[^0-9,\.]/', '', $value);
        if (strpos($normalized, ',') !== false && strpos($normalized, '.') !== false) {
            $normalized = str_replace('.', '', $normalized);
            $normalized = str_replace(',', '.', $normalized);
        } elseif (strpos($normalized, ',') !== false) {
            $normalized = str_replace(',', '.', $normalized);
        }
        $float = (float)$normalized;
    } else {
        $float = (float)$value;
    }
    return (int)round($float * 100);
}

function cents_to_brl(int $cents): string {
    return 'R$ ' . number_format($cents / 100, 2, ',', '.');
}

?>

