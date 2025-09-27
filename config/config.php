<?php
// config/config.php
// Configuration file for API keys and settings

// Load environment variables from .env file if it exists
$envFile = dirname(__DIR__) . '/.env';
if (file_exists($envFile)) {
    $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos($line, '=') !== false && strpos($line, '#') !== 0) {
            list($key, $value) = explode('=', $line, 2);
            putenv(trim($key) . '=' . trim($value));
        }
    }
}

$config = [
    'claude_api_key' => getenv('CLAUDE_API_KEY') ?: 'your-claude-api-key-here',
    'facebook_app_id' => getenv('FACEBOOK_APP_ID') ?: 'your-facebook-app-id',
    'facebook_app_secret' => getenv('FACEBOOK_APP_SECRET') ?: 'your-facebook-app-secret',
    'environment' => 'development' // Force development mode for now
];

// Validate required config
if ($config['environment'] === 'production') {
    $required = ['claude_api_key', 'facebook_app_id', 'facebook_app_secret'];
    foreach ($required as $key) {
        if (empty($config[$key]) || strpos($config[$key], 'your-') === 0) {
            error_log("Missing required config: $key");
            http_response_code(500);
            exit(json_encode(['error' => 'Server configuration error']));
        }
    }
}

return $config;
?>