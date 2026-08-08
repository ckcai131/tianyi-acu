<?php
/**
 * tianyi-acu · 奇门通玄针法 后端 API
 * 调用 calc.py 跑计算, 返回 JSON
 */
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$datetime = $_GET['datetime'] ?? '';
if (!$datetime) {
    http_response_code(400);
    echo json_encode(['error' => 'missing datetime'], JSON_UNESCAPED_UNICODE);
    exit;
}

if (!preg_match('/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/', $datetime)) {
    http_response_code(400);
    echo json_encode(['error' => 'invalid datetime format (YYYY-MM-DD HH:MM)'], JSON_UNESCAPED_UNICODE);
    exit;
}

$calc = __DIR__ . '/calc.py';
$cmd = 'python3 ' . escapeshellarg($calc) . ' ' . escapeshellarg($datetime) . ' 2>&1';

$output = [];
$rc = 0;
exec($cmd, $output, $rc);

if ($rc !== 0) {
    http_response_code(500);
    echo json_encode(['error' => 'calc.py failed', 'detail' => implode("\n", $output)], JSON_UNESCAPED_UNICODE);
    exit;
}

$result = implode('', $output);
$decoded = json_decode($result, true);
if ($decoded === null) {
    http_response_code(500);
    echo json_encode(['error' => 'invalid JSON from calc.py', 'raw' => $result], JSON_UNESCAPED_UNICODE);
    exit;
}

echo json_encode($decoded, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);