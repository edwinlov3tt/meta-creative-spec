# AI Integration Implementation Plan
## Creative Preview Tool - Claude API & Facebook API Integration

### Overview
This plan implements AI-powered ad copy generation using Claude API and Facebook API integration for automatic brand information retrieval in your Creative Preview tool.

---

## 🎯 Phase 1: Claude API Integration for Ad Copy Generation

### Recommended Model
**Claude Sonnet 4** (`claude-sonnet-4-20250514`) - Excellent for creative writing, marketing copy, and understanding business context.

### 1.1 Backend API Endpoint

Create `api/generate-copy.php`:

```php
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
    $prompt = "You are an expert Facebook/Instagram ad copywriter. Generate compelling ad copy based on the following information:\n\n";
    
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
    
    if (!empty($input['creativeDescription'])) {
        $prompt .= "**Creative Visual Description:** {$input['creativeDescription']}\n";
    }
    
    $prompt .= "\n**REQUIREMENTS:**\n";
    $prompt .= "- Primary Text: Maximum 125 characters, engaging and action-oriented\n";
    $prompt .= "- Headline: Maximum 40 characters, compelling and clear\n";
    $prompt .= "- Link Description: Maximum 30 characters, supportive copy\n";
    $prompt .= "- Display Link: Clean, professional domain format (e.g., 'example.com')\n";
    $prompt .= "- CTA: Choose from: Learn More, Shop Now, Sign Up, Download, Get Quote, Book Now, Apply Now, Contact Us\n\n";
    
    $prompt .= "**OUTPUT FORMAT:**\n";
    $prompt .= "Respond with ONLY a valid JSON object in this exact structure:\n";
    $prompt .= "{\n";
    $prompt .= '  "postText": "engaging primary text under 125 chars",'."\n";
    $prompt .= '  "headline": "compelling headline under 40 chars",'."\n";
    $prompt .= '  "linkDescription": "supporting copy under 30 chars",'."\n";
    $prompt .= '  "displayLink": "clean domain",'."\n";
    $prompt .= '  "cta": "selected CTA from list",'."\n";
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
        'max_tokens' => 1000,
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
        throw new Exception('API returned error code: ' . $httpCode);
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
    $required = ['postText', 'headline', 'linkDescription', 'displayLink', 'cta'];
    foreach ($required as $field) {
        if (!isset($copyData[$field])) {
            throw new Exception("Missing required field in generated copy: $field");
        }
    }
    
    return $copyData;
}
?>
```

### 1.2 Frontend Integration

Update `app.js` to handle AI generation:

```javascript
// Add to app.js after existing code

// Enhanced Generate Ad Copy button handler
$("#btn-generate-copy").addEventListener("click", async ()=>{
  const website = $("#input-url").value.trim();
  const company = $("#input-company").value.trim();
  const objective = $("#input-objective").value.trim();
  
  if (!website || !company || !objective){
    toast("Please provide Website/CTURL, Company Overview, and Campaign Objective.");
    return;
  }
  
  // Show loading state
  const btn = $("#btn-generate-copy");
  const originalText = btn.textContent;
  btn.textContent = "Generating...";
  btn.disabled = true;
  
  try {
    const requestData = {
      website: website,
      companyOverview: company,
      objective: objective,
      salesFormula: $("#input-formula").value,
      companyInfo: $("#input-company-info").value,
      instructions: $("#input-instructions").value,
      customPrompt: $("#input-prompt").value
    };
    
    // Handle creative upload if present
    const creativeFile = $("#input-creative").files[0];
    if (creativeFile) {
      const creativeData = await processCreativeUpload(creativeFile);
      if (creativeData) {
        requestData.creativeData = creativeData;
      }
    }
    
    const response = await fetch('./api/generate-copy.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestData)
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || 'Generation failed');
    }
    
    // Populate the generated copy
    populateGeneratedCopy(result.data);
    
    // Enable Step 2 and collapse Step 1
    step2.classList.remove("step-disabled");
    step2.setAttribute("open","");
    step1.removeAttribute("open");
    
    toast("Ad copy generated successfully!");
    step2.scrollIntoView({behavior:"smooth", block:"start"});
    
  } catch (error) {
    console.error('Generation error:', error);
    toast(`Generation failed: ${error.message}`);
  } finally {
    // Restore button state
    btn.textContent = originalText;
    btn.disabled = false;
  }
});

// Process creative upload for AI analysis
async function processCreativeUpload(file) {
  if (!file.type.startsWith('image/')) {
    return null;
  }
  
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64Data = e.target.result.split(',')[1];
      resolve({
        type: file.type,
        data: base64Data
      });
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

// Populate form fields with generated copy
function populateGeneratedCopy(data) {
  if (data.postText) {
    fields.postText.value = data.postText;
  }
  if (data.headline) {
    fields.headline.value = data.headline;
  }
  if (data.linkDescription) {
    fields.linkDesc.value = data.linkDescription;
  }
  if (data.displayLink) {
    fields.displayLink.value = data.displayLink;
  }
  if (data.cta) {
    fields.cta.value = data.cta;
  }
  
  // Update counters and preview
  updateCounters();
  syncPreview();
  
  // Save to localStorage
  save();
}
```

---

## 🎯 Phase 2: Facebook API Integration

### 2.1 Facebook API Setup

1. **Create Facebook App:**
   - Go to https://developers.facebook.com/
   - Create new app → "Business" type
   - Add "Basic Display" product
   - Get App ID and App Secret

2. **Required Permissions:**
   - `pages_read_engagement` (for page info)
   - `public_profile` (for basic info)

### 2.2 Backend Facebook API Integration

Create `api/facebook-page.php`:

```php
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
    
    $pageInfo = getFacebookPageInfo($input['facebookUrl']);
    echo json_encode(['success' => true, 'data' => $pageInfo]);
    
} catch (Exception $e) {
    error_log("Facebook API error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
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

function getFacebookPageInfo($facebookUrl) {
    global $config;
    
    $pageIdentifier = extractPageIdentifier($facebookUrl);
    
    // Get app access token
    $tokenUrl = "https://graph.facebook.com/oauth/access_token?" . http_build_query([
        'client_id' => $config['facebook_app_id'],
        'client_secret' => $config['facebook_app_secret'],
        'grant_type' => 'client_credentials'
    ]);
    
    $tokenResponse = file_get_contents($tokenUrl);
    $tokenData = json_decode($tokenResponse, true);
    
    if (!$tokenData || !isset($tokenData['access_token'])) {
        throw new Exception('Failed to get Facebook access token');
    }
    
    $accessToken = $tokenData['access_token'];
    
    // Get page information
    $pageUrl = "https://graph.facebook.com/v18.0/$pageIdentifier?" . http_build_query([
        'fields' => 'id,name,picture.width(200).height(200),category,link,fan_count',
        'access_token' => $accessToken
    ]);
    
    $pageResponse = file_get_contents($pageUrl);
    $pageData = json_decode($pageResponse, true);
    
    if (!$pageData || isset($pageData['error'])) {
        throw new Exception('Page not found or not accessible: ' . ($pageData['error']['message'] ?? 'Unknown error'));
    }
    
    return [
        'id' => $pageData['id'],
        'name' => $pageData['name'],
        'picture' => $pageData['picture']['data']['url'] ?? null,
        'category' => $pageData['category'] ?? null,
        'link' => $pageData['link'] ?? null,
        'fanCount' => $pageData['fan_count'] ?? null
    ];
}
?>
```

### 2.3 Frontend Facebook Integration

Add to `app.js`:

```javascript
// Facebook page info fetching
let facebookPageData = null;

// Add event listener for Facebook link input
fields.fbLink?.addEventListener('blur', async (e) => {
  const url = e.target.value.trim();
  if (!url || !url.includes('facebook.com')) {
    return;
  }
  
  try {
    const response = await fetch('./api/facebook-page.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ facebookUrl: url })
    });
    
    const result = await response.json();
    
    if (response.ok && result.success) {
      facebookPageData = result.data;
      updatePreviewWithFacebookData(result.data);
      toast(`Found page: ${result.data.name}`);
    } else {
      console.warn('Facebook page fetch failed:', result.error);
      // Don't show error toast for failed page fetches to avoid annoying users
    }
  } catch (error) {
    console.error('Facebook API error:', error);
  }
});

function updatePreviewWithFacebookData(data) {
  // Update brand name
  if (data.name) {
    preview.brand.textContent = data.name;
    $("#ig-company").textContent = data.name;
  }
  
  // Update profile picture
  if (data.picture) {
    updatePreviewAvatar(data.picture);
  }
  
  syncPreview();
}

function updatePreviewAvatar(pictureUrl) {
  // Update all avatar elements in the preview
  const avatars = document.querySelectorAll('.avatar');
  avatars.forEach(avatar => {
    avatar.style.backgroundImage = `url(${pictureUrl})`;
    avatar.style.backgroundSize = 'cover';
    avatar.style.backgroundPosition = 'center';
  });
}

// Reset avatar on form reset or when Facebook link is cleared
function resetPreviewAvatar() {
  const avatars = document.querySelectorAll('.avatar');
  avatars.forEach(avatar => {
    avatar.style.backgroundImage = '';
    avatar.style.backgroundColor = 'hsl(220 10% 86%)';
  });
}
```

---

## 🎯 Phase 3: Configuration & Security

### 3.1 Configuration File

Create `config/config.php`:

```php
<?php
// config/config.php
// Store outside public_html for security

$config = [
    'claude_api_key' => getenv('CLAUDE_API_KEY') ?: 'your-claude-api-key-here',
    'facebook_app_id' => getenv('FACEBOOK_APP_ID') ?: 'your-facebook-app-id',
    'facebook_app_secret' => getenv('FACEBOOK_APP_SECRET') ?: 'your-facebook-app-secret',
    'environment' => getenv('ENVIRONMENT') ?: 'development'
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
```

### 3.2 Environment Variables (SiteGround)

Set in SiteGround Site Tools > Environment Variables:
- `CLAUDE_API_KEY`: Your Claude API key
- `FACEBOOK_APP_ID`: Your Facebook App ID  
- `FACEBOOK_APP_SECRET`: Your Facebook App Secret
- `ENVIRONMENT`: `production`

### 3.3 Security Headers

Update `.htaccess`:

```apache
# Security headers
Header always set X-Frame-Options "SAMEORIGIN"
Header always set X-Content-Type-Options "nosniff"
Header always set Referrer-Policy "strict-origin-when-cross-origin"

# CORS for API endpoints
<Files "*.php">
    Header set Access-Control-Allow-Origin "*"
    Header set Access-Control-Allow-Methods "POST, GET, OPTIONS"
    Header set Access-Control-Allow-Headers "Content-Type"
</Files>

# Deny access to config files
<Files "config.php">
    Order deny,allow
    Deny from all
</Files>

# Rate limiting via mod_evasive (if available)
<IfModule mod_evasive24.c>
    DOSHashTableSize    2048
    DOSPageCount        5
    DOSSiteCount        50
    DOSPageInterval     1
    DOSSiteInterval     1
    DOSBlockingPeriod   60
</IfModule>
```

---

## 🎯 Phase 4: Error Handling & User Experience

### 4.1 Enhanced Error Handling

Add to `app.js`:

```javascript
// Enhanced error handling and user feedback
function handleAPIError(error, context) {
  console.error(`${context} error:`, error);
  
  let userMessage = 'Something went wrong. Please try again.';
  
  if (error.message.includes('Rate limit')) {
    userMessage = 'Too many requests. Please wait a moment and try again.';
  } else if (error.message.includes('network') || error.message.includes('fetch')) {
    userMessage = 'Network error. Please check your connection.';
  } else if (error.message.includes('parse') || error.message.includes('JSON')) {
    userMessage = 'Invalid response format. Please try again.';
  }
  
  toast(userMessage);
}

// Loading states for buttons
function setButtonLoading(button, loading) {
  if (loading) {
    button.dataset.originalText = button.textContent;
    button.textContent = 'Loading...';
    button.disabled = true;
    button.classList.add('loading');
  } else {
    button.textContent = button.dataset.originalText || button.textContent;
    button.disabled = false;
    button.classList.remove('loading');
  }
}
```

### 4.2 Loading States CSS

Add to `styles.css`:

```css
/* Loading states */
.btn.loading {
  opacity: 0.7;
  cursor: not-allowed;
  position: relative;
}

.btn.loading::after {
  content: '';
  position: absolute;
  width: 16px;
  height: 16px;
  top: 50%;
  right: 8px;
  margin-top: -8px;
  border: 2px solid transparent;
  border-top: 2px solid currentColor;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Enhanced toast styling */
#toast {
  max-width: 400px;
  word-wrap: break-word;
  text-align: center;
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from { 
    opacity: 0;
    transform: translate(-50%, 20px);
  }
  to { 
    opacity: 1;
    transform: translate(-50%, 0);
  }
}
```

---

## 🎯 Phase 5: Testing & Deployment

### 5.1 Local Testing

1. **Test Claude API:**
```bash
curl -X POST http://localhost/creative-preview/api/generate-copy.php \
  -H "Content-Type: application/json" \
  -d '{
    "website": "https://example.com",
    "companyOverview": "A fitness app company",
    "objective": "Drive app downloads"
  }'
```

2. **Test Facebook API:**
```bash
curl -X POST http://localhost/creative-preview/api/facebook-page.php \
  -H "Content-Type: application/json" \
  -d '{
    "facebookUrl": "https://facebook.com/nike"
  }'
```

### 5.2 Production Deployment Checklist

- [ ] Set environment variables in SiteGround
- [ ] Upload all files via SiteGround File Manager
- [ ] Test API endpoints in production
- [ ] Verify HTTPS is working
- [ ] Check error logs in SiteGround
- [ ] Test rate limiting
- [ ] Verify CORS headers

### 5.3 Monitoring

Add basic logging to track usage:

```php
// Add to both API files
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
```

---

## 📋 Implementation Checklist

### Setup Phase
- [ ] Create Claude API account and get API key
- [ ] Create Facebook App and get credentials
- [ ] Set up SiteGround environment variables
- [ ] Create directory structure

### Backend Development
- [ ] Create `config/config.php`
- [ ] Implement `api/generate-copy.php`
- [ ] Implement `api/facebook-page.php`
- [ ] Add error handling and logging
- [ ] Test API endpoints locally

### Frontend Integration
- [ ] Update `app.js` with AI generation
- [ ] Add Facebook page info fetching
- [ ] Implement loading states
- [ ] Add error handling
- [ ] Test user flow

### Security & Deployment
- [ ] Update `.htaccess` with security headers
- [ ] Deploy to SiteGround
- [ ] Test in production
- [ ] Monitor API usage and errors

### Cost Estimates

**Monthly Costs:**
- Claude API: ~$5-25 (depends on usage)
- Facebook API: Free for basic page info
- Total: ~$5-25/month additional

**Usage Estimates:**
- Claude API: ~$0.015 per generation (1K tokens)
- 1000 generations/month = ~$15
- Facebook API: Free tier covers most usage

---

## 🚀 Usage Instructions

### For Users:

1. **Fill Required Fields:**
   - Website/CTURL: Landing page URL
   - Company Overview: Brief description of the business
   - Campaign Objective: What the ad should achieve

2. **Optional Enhancement:**
   - Add Facebook page link for automatic brand info
   - Upload creative for AI to analyze
   - Add specific instructions or custom prompts

3. **Generate:**
   - Click "Generate Ad Copy"
   - Wait 3-5 seconds for AI processing
   - Review and edit generated copy
   - Export preview and spec

### For Developers:

1. **Extending Prompts:**
   - Modify `buildAdCopyPrompt()` in `generate-copy.php`
   - Add new input fields to frontend
   - Update prompt structure

2. **Adding New AI Features:**
   - Create new API endpoints following same pattern
   - Use Claude's multimodal capabilities for image analysis
   - Implement A/B testing for different prompts

3. **Scaling:**
   - Add database logging for analytics
   - Implement user accounts and saved campaigns
   - Add bulk generation features

This implementation provides a solid foundation for AI-powered ad copy generation while maintaining the tool's simplicity and effectiveness.
