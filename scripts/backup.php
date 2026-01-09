<?php

$config = [
    'supabase_url' => getenv('SUPABASE_URL'),
    'supabase_key' => getenv('SUPABASE_KEY'),
    'telegram_bot_token' => getenv('TELEGRAM_BOT_TOKEN'),
    'telegram_chat_id' => getenv('TELEGRAM_CHAT_ID')
];

function logMessage($msg) {
    echo "[" . date('Y-m-d H:i:s') . "] " . $msg . "\n";
}

function fetchTableData($table, $config) {
    $url = $config['supabase_url'] . '/rest/v1/' . $table . '?select=*';
    $ch = curl_init($url);
    
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'apikey: ' . $config['supabase_key'],
        'Authorization: Bearer ' . $config['supabase_key']
    ]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($httpCode !== 200) {
        throw new Exception("Failed to fetch $table: HTTP $httpCode");
    }
    
    return json_decode($response, true);
}

function sendToTelegram($filePath, $config) {
    $url = "https://api.telegram.org/bot" . $config['telegram_bot_token'] . "/sendDocument";
    
    $postFields = [
        'chat_id' => $config['telegram_chat_id'],
        'document' => new CURLFile($filePath),
        'caption' => "📦 Database Backup: " . date('Y-m-d H:i:s')
    ];
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_POST, 1);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $postFields);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    
    $response = curl_exec($ch);
    curl_close($ch);
    
    return json_decode($response, true);
}

try {
    logMessage("Starting backup process...");
    
    if (!$config['supabase_url'] || !$config['telegram_bot_token']) {
        throw new Exception("Missing configuration environment variables");
    }
    
    $tables = ['masters', 'procedures', 'bookings', 'clients', 'breaks'];
    $backupData = [];
    
    foreach ($tables as $table) {
        logMessage("Fetching table: $table");
        $backupData[$table] = fetchTableData($table, $config);
    }
    
    $jsonContent = json_encode($backupData, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    $filename = 'backup_' . date('Y_m_d_H_i_s') . '.json';
    $filePath = sys_get_temp_dir() . '/' . $filename;
    
    file_put_contents($filePath, $jsonContent);
    logMessage("Backup file created: $filePath");
    
    logMessage("Sending to Telegram...");
    $result = sendToTelegram($filePath, $config);
    
    if (!$result['ok']) {
        throw new Exception("Telegram API Error: " . ($result['description'] ?? 'Unknown error'));
    }
    
    unlink($filePath);
    logMessage("Backup completed successfully!");
    
} catch (Exception $e) {
    logMessage("ERROR: " . $e->getMessage());
    exit(1);
}
