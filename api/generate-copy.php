<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    exit(json_encode(['error' => 'Method not allowed']));
}

// Rate limiting (simple session-based)
session_start();
if (!isset($_SESSION['api_calls'])) {
    $_SESSION['api_calls'] = [];
}

$_SESSION['api_calls'][] = time();
$_SESSION['api_calls'] = array_filter($_SESSION['api_calls'], function($t) {
    return $t > time() - 3600; // Keep last hour
});

if (count($_SESSION['api_calls']) > 20) {
    http_response_code(429);
    exit(json_encode(['error' => 'Rate limit exceeded. Try again later.']));
}

// Get configuration
require_once('../config/config.php');

try {
    $input = json_decode(file_get_contents('php://input'), true);
    
    // Validate required fields
    if (!isset($input['website']) || !isset($input['companyOverview']) || !isset($input['objective'])) {
        throw new Exception('Missing required fields: website, companyOverview, objective');
    }
    
    // Build the prompt
    $prompt = buildAdCopyPrompt($input);
    
    // Call Claude API
    $response = callClaudeAPI($prompt, $input['creativeData'] ?? null);
    
    echo json_encode(['success' => true, 'data' => $response]);
    
} catch (Exception $e) {
    error_log("Ad copy generation error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}

function buildAdCopyPrompt($input) {
    $currentDate = date('F Y');
    $currentYear = date('Y');
    
    $prompt = "You are an expert Facebook/Instagram ad copywriter. Today's date is {$currentDate}. Current year is {$currentYear}.\n\n";
    $prompt .= "Generate compelling ad copy based on the following information:\n\n";
    
    // Required fields
    $prompt .= "**Website/Landing Page:** {$input['website']}\n";
    $prompt .= "**Company Overview:** {$input['companyOverview']}\n";
    $prompt .= "**Campaign Objective:** {$input['objective']}\n\n";
    
    // Optional fields
    if (!empty($input['salesFormula'])) {
        $prompt .= "**Sales Formula:** {$input['salesFormula']}\n";
    }
    
    if (!empty($input['companyInfo'])) {
        $prompt .= "**Additional Company Info:** {$input['companyInfo']}\n";
    }
    
    if (!empty($input['instructions'])) {
        $prompt .= "**Special Instructions:** {$input['instructions']}\n";
    }
    
    if (!empty($input['customPrompt'])) {
        $prompt .= "**Custom Requirements:** {$input['customPrompt']}\n";
    }
    
    // Facebook Page Context
    if (!empty($input['facebookPageData'])) {
        $pageData = $input['facebookPageData'];
        $prompt .= "\n**FACEBOOK PAGE CONTEXT:**\n";
        $prompt .= "**Page Name:** {$pageData['name']}\n";
        if (!empty($pageData['categories'])) {
            $categories = is_array($pageData['categories']) ? implode(', ', $pageData['categories']) : $pageData['categories'];
            $prompt .= "**Business Category:** {$categories}\n";
        }
        if (!empty($pageData['intro'])) {
            $prompt .= "**Business Description:** {$pageData['intro']}\n";
        }
        if (!empty($pageData['followers'])) {
            $prompt .= "**Social Following:** {$pageData['followers']} followers\n";
        }
        if (!empty($pageData['website'])) {
            $prompt .= "**Business Website:** {$pageData['website']}\n";
        }
        if (!empty($pageData['instagram_details']['result']['full_name'])) {
            $prompt .= "**Instagram Name:** {$pageData['instagram_details']['result']['full_name']}\n";
        }
        $prompt .= "\n";
    }
    
    // Emoji preference
    $emojiInstruction = isset($input['includeEmoji']) && $input['includeEmoji'] ? 
        "Include 1 relevant emoji at the beginning of the post text." : 
        "Do NOT include any emojis in the post text.";
    $prompt .= "**Emoji Instructions:** {$emojiInstruction}\n";
    
    if (!empty($input['creativeDescription'])) {
        $prompt .= "**Creative Visual Description:** {$input['creativeDescription']}\n";
    }
    
    $prompt .= "\n**REQUIREMENTS:**\n";
    $prompt .= "- Primary Text: Maximum 125 characters, engaging and action-oriented. {$emojiInstruction}\n";
    $prompt .= "- Headline: Maximum 40 characters, compelling and clear\n";
    $prompt .= "- Link Description: Maximum 30 characters, action-oriented copy that tells users what they'll do on the site (e.g., 'Get Your Free Estimate', 'Start Your Quote', 'Browse Our Services'). Should be relevant to the campaign objective and NOT redundant with headline or post text.\n";
    $prompt .= "- Display Link: Clean, professional domain format (e.g., 'example.com')\n";
    $prompt .= "- CTA: Choose from: Learn More, Shop Now, Sign Up, Download, Get Quote, Book Now, Apply Now, Contact Us\n";
    $prompt .= "- Ad Name: Brief, descriptive name including current month and year ({$currentDate}). Focus on ad content, not goals. Examples: 'Kitchen Remodel August 2025', 'Solar Installation {$currentDate}', 'Home Security {$currentDate}'. Use spaces between words, never underscores or hyphens.\n\n";
    
    $prompt .= "**OUTPUT FORMAT:**\n";
    $prompt .= "Respond with ONLY a valid JSON object in this exact structure:\n";
    $prompt .= "{\n";
    $prompt .= '  "postText": "engaging primary text under 125 chars",'."\n";
    $prompt .= '  "headline": "compelling headline under 40 chars",'."\n";
    $prompt .= '  "linkDescription": "supporting copy under 30 chars",'."\n";
    $prompt .= '  "displayLink": "clean domain",'."\n";
    $prompt .= '  "cta": "selected CTA from list",'."\n";
    $prompt .= '  "adName": "descriptive campaign name under 50 chars",'."\n";
    $prompt .= '  "reasoning": "brief explanation of creative approach"'."\n";
    $prompt .= "}\n\n";
    $prompt .= "DO NOT include any text outside the JSON object. Ensure all character limits are strictly followed.";
    
    return $prompt;
}

function callClaudeAPI($prompt, $creativeData = null) {
    global $config;
    
    $messages = [];
    
    // If there's creative data (image), include it in the message
    if ($creativeData) {
        $messages[] = [
            'role' => 'user',
            'content' => [
                [
                    'type' => 'image',
                    'source' => [
                        'type' => 'base64',
                        'media_type' => $creativeData['type'],
                        'data' => $creativeData['data']
                    ]
                ],
                [
                    'type' => 'text',
                    'text' => "Here's the creative visual for this ad campaign. Please analyze it and incorporate relevant elements into your copy generation.\n\n" . $prompt
                ]
            ]
        ];
    } else {
        $messages[] = [
            'role' => 'user',
            'content' => $prompt
        ];
    }
    
    $data = [
        'model' => 'claude-sonnet-4-20250514',
        'max_tokens' => 2500,
        'messages' => $messages
    ];
    
    $ch = curl_init('https://api.anthropic.com/v1/messages');
    curl_setopt_array($ch, [
        CURLOPT_HTTPHEADER => [
            'x-api-key: ' . $config['claude_api_key'],
            'anthropic-version: 2023-06-01',
            'content-type: application/json'
        ],
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => json_encode($data),
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 30,
        CURLOPT_CONNECTTIMEOUT => 10
    ]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    
    if (curl_errno($ch)) {
        throw new Exception('API request failed: ' . curl_error($ch));
    }
    
    curl_close($ch);
    
    if ($httpCode !== 200) {
        $decoded = json_decode($response, true);
        $errorMsg = isset($decoded['error']['message']) ? $decoded['error']['message'] : "API returned error code: $httpCode";
        throw new Exception($errorMsg);
    }
    
    $decoded = json_decode($response, true);
    
    if (!$decoded || !isset($decoded['content'][0]['text'])) {
        throw new Exception('Invalid API response format');
    }
    
    // Extract and parse the JSON from Claude's response
    $responseText = $decoded['content'][0]['text'];
    
    // Clean up response (remove potential markdown code blocks)
    $responseText = preg_replace('/```json\s?/', '', $responseText);
    $responseText = preg_replace('/```\s?/', '', $responseText);
    $responseText = trim($responseText);
    
    $copyData = json_decode($responseText, true);
    
    if (!$copyData) {
        throw new Exception('Failed to parse generated copy JSON');
    }
    
    // Validate that all required fields are present
    $required = ['postText', 'headline', 'linkDescription', 'displayLink', 'cta', 'adName'];
    foreach ($required as $field) {
        if (!isset($copyData[$field])) {
            throw new Exception("Missing required field in generated copy: $field");
        }
    }
    
    return $copyData;
}

// Add logging function
function logAPIUsage($endpoint, $success, $userId = null) {
    $logData = [
        'timestamp' => date('Y-m-d H:i:s'),
        'endpoint' => $endpoint,
        'success' => $success,
        'user_id' => $userId ?? $_SESSION['user_id'] ?? 'anonymous',
        'ip' => $_SERVER['REMOTE_ADDR'] ?? 'unknown'
    ];
    
    error_log("API_USAGE: " . json_encode($logData));
}
?>