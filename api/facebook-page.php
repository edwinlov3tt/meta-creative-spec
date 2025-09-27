<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

require_once('../config/config.php');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    exit(json_encode(['error' => 'Method not allowed']));
}

try {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($input['facebookUrl'])) {
        throw new Exception('Facebook URL is required');
    }
    
    $facebookUrl = $input['facebookUrl'];
    $websiteUrl = $input['websiteUrl'] ?? null; // Fallback domain from Step 1
    
    $pageInfo = getFacebookPageInfoWithFallbacks($facebookUrl, $websiteUrl);
    
    // Log successful Facebook API request
    logFacebookRequest($pageInfo, true);
    
    echo json_encode(['success' => true, 'data' => $pageInfo]);
    
} catch (Exception $e) {
    error_log("Facebook API error: " . $e->getMessage());
    
    // Log failed Facebook API request
    logFacebookRequest(['error' => $e->getMessage(), 'url' => $facebookUrl], false);
    
    // If we have a website URL, try domain fallback instead of error
    if (!empty($input['websiteUrl'])) {
        try {
            $fallbackInfo = getDomainFallbackInfo($input['websiteUrl']);
            logFacebookRequest($fallbackInfo, true, 'domain_fallback_after_error');
            echo json_encode(['success' => true, 'data' => $fallbackInfo, 'method' => 'domain_fallback']);
        } catch (Exception $fallbackError) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()]);
        }
    } else {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
}

function extractPageIdentifier($url) {
    // Handle various Facebook URL formats
    $patterns = [
        '/facebook\.com\/([^\/\?]+)/i',
        '/fb\.com\/([^\/\?]+)/i',
        '/m\.facebook\.com\/([^\/\?]+)/i'
    ];
    
    foreach ($patterns as $pattern) {
        if (preg_match($pattern, $url, $matches)) {
            return $matches[1];
        }
    }
    
    throw new Exception('Invalid Facebook URL format');
}

function getFacebookPageInfoWithFallbacks($facebookUrl, $websiteUrl = null) {
    $errorMessages = [];
    
    // Method 1: Try Graph API first (best quality when it works)
    try {
        $graphInfo = getFacebookGraphAPIInfo($facebookUrl);
        if (!empty($graphInfo['name'])) {
            return $graphInfo;
        }
    } catch (Exception $e) {
        $errorMessages[] = "Graph API: " . $e->getMessage();
        error_log("Graph API failed: " . $e->getMessage());
    }
    
    // Method 2: Try Open Graph scraping
    try {
        $scrapedInfo = scrapeFacebookPageInfo($facebookUrl);
        if (!empty($scrapedInfo['name'])) {
            return $scrapedInfo;
        }
    } catch (Exception $e) {
        $errorMessages[] = "Open Graph scraping: " . $e->getMessage();
        error_log("Open Graph scraping failed: " . $e->getMessage());
    }
    
    // Method 3: Try Facebook oEmbed API
    try {
        $oembedInfo = getFacebookOEmbedInfo($facebookUrl);
        if (!empty($oembedInfo['name'])) {
            return $oembedInfo;
        }
    } catch (Exception $e) {
        $errorMessages[] = "oEmbed API: " . $e->getMessage();
        error_log("oEmbed API failed: " . $e->getMessage());
    }
    
    // Method 4: Try URL parsing (always works but basic quality)
    try {
        $urlInfo = extractInfoFromUrl($facebookUrl);
        if ($urlInfo && !empty($urlInfo['name'])) {
            return $urlInfo;
        }
    } catch (Exception $e) {
        $errorMessages[] = "URL parsing: " . $e->getMessage();
        error_log("URL parsing failed: " . $e->getMessage());
    }
    
    // Method 5: Final fallback to domain info ONLY if all Facebook methods failed
    if ($websiteUrl) {
        try {
            $domainInfo = getDomainFallbackInfo($websiteUrl);
            $domainInfo['fallback_reason'] = 'All Facebook methods failed: ' . implode('; ', $errorMessages);
            return $domainInfo;
        } catch (Exception $e) {
            error_log("Domain fallback failed: " . $e->getMessage());
        }
    }
    
    throw new Exception('Could not extract Facebook page information from any method. Errors: ' . implode('; ', $errorMessages));
}

function extractInfoFromUrl($facebookUrl) {
    $pageIdentifier = extractPageIdentifier($facebookUrl);
    
    if ($pageIdentifier) {
        // Only do minimal cleanup for usernames
        // Don't try to create business names from usernames as it's often wrong
        $name = $pageIdentifier;
        
        // Only clean up obvious technical artifacts
        $name = str_replace(['.', '_'], ' ', $name);
        $name = trim($name);
        
        // If it looks like a username (all lowercase, numbers), keep it minimal
        if (preg_match('/^[a-z0-9_.-]+$/', $pageIdentifier)) {
            $name = $pageIdentifier; // Keep original username format
        } else {
            // Only capitalize if it looks like it might be words
            $name = ucwords($name);
        }
        
        return [
            'name' => $name,
            'picture' => "https://graph.facebook.com/" . urlencode($pageIdentifier) . "/picture?type=large",
            'url' => $facebookUrl,
            'method' => 'url_parsing',
            'note' => 'Username extracted from URL - may not be actual page name'
        ];
    }
    
    return null;
}

function scrapeFacebookPageInfo($facebookUrl) {
    // Add mobile prefix to get better meta tags
    $mobileUrl = str_replace('facebook.com', 'm.facebook.com', $facebookUrl);
    
    // Set up context with user agent
    $context = stream_context_create([
        'http' => [
            'method' => 'GET',
            'user_agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'timeout' => 10,
            'follow_location' => true,
            'max_redirects' => 3
        ]
    ]);
    
    // Get the page content
    $html = @file_get_contents($mobileUrl, false, $context);
    
    if ($html === false) {
        // Fallback to regular URL
        $html = @file_get_contents($facebookUrl, false, $context);
        if ($html === false) {
            throw new Exception('Could not fetch page content');
        }
    }
    
    // Parse HTML
    $dom = new DOMDocument();
    @$dom->loadHTML($html);
    $xpath = new DOMXPath($dom);
    
    // Extract Open Graph and meta data
    $pageInfo = [
        'name' => extractMetaContent($xpath, 'og:title') ?: extractMetaContent($xpath, 'title') ?: extractPageName($html),
        'picture' => extractMetaContent($xpath, 'og:image'),
        'description' => extractMetaContent($xpath, 'og:description'),
        'url' => extractMetaContent($xpath, 'og:url') ?: $facebookUrl,
        'method' => 'open_graph_scraping'
    ];
    
    // Clean up the name (remove "| Facebook" suffix)
    if ($pageInfo['name']) {
        $pageInfo['name'] = preg_replace('/\s*\|\s*Facebook\s*$/', '', $pageInfo['name']);
        $pageInfo['name'] = trim($pageInfo['name']);
    }
    
    // Validate we got something useful
    if (empty($pageInfo['name']) && empty($pageInfo['picture'])) {
        throw new Exception('Could not extract page information - page may be private or restricted');
    }
    
    return $pageInfo;
}

function getFacebookOEmbedInfo($facebookUrl) {
    // Use Facebook's oEmbed API
    $oembedUrl = 'https://www.facebook.com/plugins/post/oembed.json/?url=' . urlencode($facebookUrl);
    
    $context = stream_context_create([
        'http' => [
            'timeout' => 10,
            'user_agent' => 'Mozilla/5.0 (compatible; CreativePreview/1.0)'
        ]
    ]);
    
    $response = @file_get_contents($oembedUrl, false, $context);
    
    if ($response === false) {
        throw new Exception('Could not fetch oEmbed info');
    }
    
    $data = json_decode($response, true);
    
    if (!$data) {
        throw new Exception('Invalid response from Facebook oEmbed');
    }
    
    return [
        'name' => extractAuthorName($data),
        'picture' => null, // oEmbed doesn't provide profile pictures
        'url' => $data['url'] ?? $facebookUrl,
        'method' => 'oembed_api'
    ];
}

function getFacebookGraphAPIInfo($facebookUrl) {
    global $config;
    
    $pageIdentifier = derivePageIdentifier($facebookUrl);
    
    if (!$pageIdentifier) {
        throw new Exception('Unable to parse Page identifier from URL');
    }
    
    // Test mode for development
    if ($config['environment'] === 'development' && $pageIdentifier === 'nike') {
        return [
            'pageid' => '15087023444',
            'name' => 'Nike',
            'picture' => 'https://scontent-lax3-2.xx.fbcdn.net/v/t39.30808-1/347632633_806437687574050_5273940193516970644_n.jpg?stp=dst-jpg_s200x200_tt6&_nc_cat=1&ccb=1-7&_nc_sid=f4b9fd&_nc_ohc=qTUQ5RvqZzgQ7kNvgFy4vLX&_nc_zt=24&_nc_ht=scontent-lax3-2.xx&_nc_gid=ANDsAbRBhqQEtOlIdVKe9FK&oh=00_AYBr2xLqE61DiV8cjMOGdCT7OJzOdHnGQP3_EHfLy3iCBg&oe=67437C91',
            'url' => 'https://www.facebook.com/nike/',
            'method' => 'graph_api_test'
        ];
    }
    
    // Get app access token
    $accessToken = getAppAccessToken();
    if (!$accessToken) {
        throw new Exception('No app access token available');
    }
    
    // Build Graph API request using v19.0 and optimized fields
    $fields = 'id,name,link,picture.type(large){url}';
    $graphUrl = "https://graph.facebook.com/v19.0/" . rawurlencode($pageIdentifier) . "?" . http_build_query([
        'fields' => $fields,
        'access_token' => $accessToken
    ]);
    
    $ch = curl_init($graphUrl);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 15,
        CURLOPT_FOLLOWLOCATION => false,
        CURLOPT_HTTPHEADER => ['Accept: application/json']
    ]);
    
    $response = curl_exec($ch);
    if ($response === false) {
        $error = curl_error($ch);
        curl_close($ch);
        throw new Exception('cURL error: ' . $error);
    }
    
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    $data = json_decode($response, true);
    if (!is_array($data)) {
        throw new Exception('Invalid JSON response from Facebook API');
    }
    
    if ($httpCode >= 400 || isset($data['error'])) {
        $errorMsg = $data['error']['message'] ?? "HTTP $httpCode";
        throw new Exception('Facebook API error: ' . $errorMsg);
    }
    
    return [
        'pageid' => isset($data['id']) ? (string)$data['id'] : '',
        'name' => $data['name'] ?? '',
        'picture' => $data['picture']['data']['url'] ?? '',
        'url' => $data['link'] ?? $facebookUrl,
        'method' => 'graph_api'
    ];
}

function derivePageIdentifier($facebookUrl) {
    $parts = parse_url($facebookUrl);
    if (!$parts || empty($parts['host'])) {
        return null;
    }
    
    // Normalize host (accept facebook.com, www.facebook.com, m.facebook.com)
    if (!preg_match('/(^|\.)facebook\.com$/i', $parts['host'])) {
        return null; // not a facebook.com URL
    }
    
    $path = rtrim($parts['path'] ?? '', '/');
    parse_str($parts['query'] ?? '', $query);
    
    // /profile.php?id=NNN
    if (strpos($path, '/profile.php') !== false && !empty($query['id'])) {
        return (string)$query['id'];
    }
    
    // /pages/.../NUMERIC_ID
    $segments = array_values(array_filter(explode('/', $path)));
    if ($segments) {
        $last = end($segments);
        if ($last !== false && preg_match('/^\d+$/', $last)) {
            return $last;
        }
        // vanilla vanity: /{username}
        return $segments[0];
    }
    
    return null;
}

function getAppAccessToken() {
    global $config;
    
    // Try environment variable first
    $envToken = getenv('FB_APP_TOKEN');
    if ($envToken) {
        return $envToken;
    }
    
    // Generate via client_credentials
    if (empty($config['facebook_app_id']) || empty($config['facebook_app_secret'])) {
        return null;
    }
    
    $tokenUrl = "https://graph.facebook.com/oauth/access_token?" . http_build_query([
        'client_id' => $config['facebook_app_id'],
        'client_secret' => $config['facebook_app_secret'],
        'grant_type' => 'client_credentials'
    ]);
    
    $ch = curl_init($tokenUrl);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 10
    ]);
    
    $response = curl_exec($ch);
    if ($response === false) {
        curl_close($ch);
        return null;
    }
    
    curl_close($ch);
    $data = json_decode($response, true);
    
    return $data['access_token'] ?? null;
}

function getDomainFallbackInfo($websiteUrl) {
    $parsedUrl = parse_url($websiteUrl);
    if (!$parsedUrl || !isset($parsedUrl['host'])) {
        throw new Exception('Invalid website URL for fallback');
    }
    
    $domain = $parsedUrl['host'];
    $domain = preg_replace('/^www\./', '', $domain); // Remove www
    
    // Create a nice brand name from domain
    $brandName = str_replace(['.com', '.org', '.net', '.co', '.io'], '', $domain);
    $brandName = ucwords(str_replace(['-', '_', '.'], ' ', $brandName));
    
    // Try to get favicon
    $faviconUrl = "https://www.google.com/s2/favicons?sz=64&domain=" . urlencode($domain);
    
    // Verify favicon exists
    $context = stream_context_create([
        'http' => ['timeout' => 5, 'method' => 'HEAD']
    ]);
    
    $faviconExists = @get_headers($faviconUrl, 1, $context);
    if (!$faviconExists || strpos($faviconExists[0], '200') === false) {
        // Fallback to direct favicon check
        $faviconUrl = $parsedUrl['scheme'] . '://' . $domain . '/favicon.ico';
        $faviconExists = @get_headers($faviconUrl, 1, $context);
        if (!$faviconExists || strpos($faviconExists[0], '200') === false) {
            $faviconUrl = null;
        }
    }
    
    return [
        'name' => $brandName,
        'picture' => $faviconUrl,
        'url' => $websiteUrl,
        'domain' => $domain,
        'method' => 'domain_fallback'
    ];
}

function extractMetaContent($xpath, $property) {
    // Try og: properties first
    $nodes = $xpath->query("//meta[@property='$property']");
    if ($nodes->length > 0) {
        return $nodes->item(0)->getAttribute('content');
    }
    
    // Try name attributes
    $nodes = $xpath->query("//meta[@name='$property']");
    if ($nodes->length > 0) {
        return $nodes->item(0)->getAttribute('content');
    }
    
    // For title tag specifically
    if ($property === 'title') {
        $nodes = $xpath->query('//title');
        if ($nodes->length > 0) {
            return $nodes->item(0)->textContent;
        }
    }
    
    return null;
}

function extractPageName($html) {
    // Fallback: try to extract from various patterns in the HTML
    $patterns = [
        '/<title[^>]*>([^<]+)<\/title>/i',
        '/pageTitle["\']:\s*["\'](([^"\'])+)["\']//',
        '/og:title["\']?\s*content=["\'](([^"\'])+)["\']//',
    ];
    
    foreach ($patterns as $pattern) {
        if (preg_match($pattern, $html, $matches)) {
            $title = html_entity_decode($matches[1], ENT_QUOTES, 'UTF-8');
            $title = preg_replace('/\s*\|\s*Facebook\s*$/', '', $title);
            return trim($title);
        }
    }
    
    return null;
}

function extractAuthorName($oembedData) {
    // Extract author name from oEmbed data
    if (isset($oembedData['author_name'])) {
        return $oembedData['author_name'];
    }
    
    // Try to extract from HTML
    if (isset($oembedData['html'])) {
        if (preg_match('/data-href="[^"]*facebook\.com\/([^"\/]+)/', $oembedData['html'], $matches)) {
            return ucwords(str_replace(['-', '_', '.'], ' ', $matches[1]));
        }
    }
    
    return null;
}

function logFacebookRequest($data, $success, $context = null) {
    $logEntry = [
        'timestamp' => date('Y-m-d H:i:s'),
        'success' => $success,
        'context' => $context,
        'page_id' => $data['pageid'] ?? ($data['id'] ?? ''),
        'name' => $data['name'] ?? '',
        'picture' => $data['picture'] ?? '',
        'url' => $data['url'] ?? '',
        'method' => $data['method'] ?? 'unknown',
        'error' => $data['error'] ?? null,
        'ip' => $_SERVER['REMOTE_ADDR'] ?? 'unknown'
    ];
    
    // Log to CSV file
    $logFile = dirname(__DIR__) . '/logs/facebook_requests.csv';
    $logDir = dirname($logFile);
    
    // Create logs directory if it doesn't exist
    if (!is_dir($logDir)) {
        @mkdir($logDir, 0755, true);
    }
    
    // Add CSV header if file doesn't exist
    $needsHeader = !file_exists($logFile);
    
    $csvLine = [
        $logEntry['timestamp'],
        $logEntry['success'] ? 'SUCCESS' : 'FAILED',
        $logEntry['context'] ?? '',
        $logEntry['page_id'],
        $logEntry['name'],
        $logEntry['picture'],
        $logEntry['url'],
        $logEntry['method'],
        $logEntry['error'] ?? '',
        $logEntry['ip']
    ];
    
    $fp = @fopen($logFile, 'a');
    if ($fp) {
        if ($needsHeader) {
            fputcsv($fp, ['Timestamp', 'Status', 'Context', 'Page ID', 'Name', 'Picture URL', 'Page URL', 'Method', 'Error', 'IP Address'], ',', '"', '\\');
        }
        fputcsv($fp, $csvLine, ',', '"', '\\');
        fclose($fp);
    }
    
    // Also log to JSON file for easier programmatic access
    $jsonLogFile = dirname(__DIR__) . '/logs/facebook_requests.json';
    $existingData = [];
    
    if (file_exists($jsonLogFile)) {
        $existingContent = @file_get_contents($jsonLogFile);
        if ($existingContent) {
            $existingData = json_decode($existingContent, true) ?: [];
        }
    }
    
    $existingData[] = $logEntry;
    
    // Keep only last 1000 entries to prevent file from growing too large
    if (count($existingData) > 1000) {
        $existingData = array_slice($existingData, -1000);
    }
    
    @file_put_contents($jsonLogFile, json_encode($existingData, JSON_PRETTY_PRINT));
}
?>