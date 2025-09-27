# Creative Preview Implementation Plan
## For Simple HTML/CSS/JS/PHP Deployment on SiteGround

### Phase 1: Frontend Foundation (Current State)
✅ **Completed**
- Single-file HTML prototype with embedded preview
- CSS with shadcn-inspired design tokens
- Vanilla JavaScript for all interactions
- Local storage persistence
- Export functionality (PNG/JPG)

### Phase 2: Backend Integration with PHP

#### 2.1 Directory Structure
```
/creative-preview/
├── index.php              # Main application (converted from HTML)
├── api/
│   ├── generate.php       # AI generation endpoint
│   ├── export.php         # Server-side export handler
│   └── config.php         # API keys and configuration
├── assets/
│   ├── css/
│   │   └── styles.css
│   ├── js/
│   │   └── app.js
│   └── images/
│       └── facebook-ad-mockup.png
├── includes/
│   ├── header.php         # Common header
│   └── footer.php         # Common footer
└── .htaccess              # Security and routing
```

#### 2.2 PHP Backend Components

**generate.php** - AI Generation Endpoint
```php
<?php
// Handle CORS
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

// Get API key from environment or config
$apiKey = getenv('CLAUDE_API_KEY') ?: require_once('../config.php')['claude_key'];

// Process request
$input = json_decode(file_get_contents('php://input'), true);

// Call Claude API
$ch = curl_init('https://api.anthropic.com/v1/messages');
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'x-api-key: ' . $apiKey,
    'anthropic-version: 2023-06-01',
    'content-type: application/json'
]);
curl_setopt($ch, CURLOPT_POST, 1);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
    'model' => 'claude-3-sonnet-20240229',
    'max_tokens' => 1024,
    'messages' => [
        ['role' => 'user', 'content' => buildPrompt($input)]
    ]
]));
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

$response = curl_exec($ch);
curl_close($ch);

echo $response;
?>
```

**export.php** - Server-side Export
```php
<?php
// For better quality exports using headless Chrome/Puppeteer
// This would require Node.js on the server or a third-party service

// Simple approach: Return base64 image from client
$imageData = $_POST['imageData'];
$format = $_POST['format'] ?? 'png';

// Decode and save temporarily
$data = base64_decode(preg_replace('#^data:image/\w+;base64,#i', '', $imageData));
$filename = 'export_' . uniqid() . '.' . $format;
$filepath = sys_get_temp_dir() . '/' . $filename;
file_put_contents($filepath, $data);

// Return download
header('Content-Type: application/octet-stream');
header('Content-Disposition: attachment; filename="' . $filename . '"');
readfile($filepath);
unlink($filepath);
?>
```

### Phase 3: SiteGround Deployment

#### 3.1 Pre-deployment Checklist
- [ ] Purchase/setup SiteGround hosting plan
- [ ] Configure domain/subdomain
- [ ] Enable SSL certificate
- [ ] Set up FTP/SSH access
- [ ] Configure PHP version (7.4+ recommended)

#### 3.2 Deployment Steps

1. **Prepare Files**
```bash
# Create deployment package
mkdir creative-preview-deploy
cp index.html creative-preview-deploy/index.php
cp styles.css creative-preview-deploy/assets/css/
cp app.js creative-preview-deploy/assets/js/
cp -r assets/* creative-preview-deploy/assets/images/
```

2. **Update File Paths in index.php**
```php
<!-- Change from -->
<link rel="stylesheet" href="./styles.css" />
<script src="./app.js"></script>

<!-- To -->
<link rel="stylesheet" href="assets/css/styles.css" />
<script src="assets/js/app.js"></script>
```

3. **Create .htaccess for Security**
```apache
# Deny access to sensitive files
<FilesMatch "\.(php|inc)$">
    Order allow,deny
    Deny from all
</FilesMatch>

# Allow API endpoints
<FilesMatch "^(generate|export)\.php$">
    Order allow,deny
    Allow from all
</FilesMatch>

# Enable CORS for assets
<FilesMatch "\.(css|js|png|jpg|jpeg|gif)$">
    Header set Access-Control-Allow-Origin "*"
</FilesMatch>
```

4. **Upload via SiteGround**
   - Use SiteGround File Manager or FTP
   - Upload to public_html or subdomain folder
   - Set proper permissions (755 for folders, 644 for files)

5. **Configure Environment Variables**
   - In SiteGround Site Tools > Site > Environment Variables
   - Add CLAUDE_API_KEY with your API key
   - Or create config.php outside public_html

### Phase 4: Enhanced Features (Optional)

#### 4.1 Database Integration (MySQL)
```sql
CREATE TABLE ad_creatives (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(255),
    spec_data JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

#### 4.2 User Sessions
```php
// Simple session management
session_start();
if (!isset($_SESSION['user_id'])) {
    $_SESSION['user_id'] = uniqid('user_', true);
}
```

#### 4.3 API Rate Limiting
```php
// Simple rate limiting with sessions
if (!isset($_SESSION['api_calls'])) {
    $_SESSION['api_calls'] = [];
}

$_SESSION['api_calls'][] = time();
$_SESSION['api_calls'] = array_filter($_SESSION['api_calls'], function($t) {
    return $t > time() - 3600; // Keep last hour
});

if (count($_SESSION['api_calls']) > 10) {
    http_response_code(429);
    die(json_encode(['error' => 'Rate limit exceeded']));
}
```

### Phase 5: Production Optimization

1. **Minify Assets**
```bash
# Use online tools or npm packages
uglifyjs app.js -o app.min.js
cssnano styles.css styles.min.css
```

2. **Enable Caching**
```apache
# In .htaccess
<IfModule mod_expires.c>
    ExpiresActive On
    ExpiresByType text/css "access plus 1 month"
    ExpiresByType application/javascript "access plus 1 month"
    ExpiresByType image/png "access plus 1 year"
</IfModule>
```

3. **CDN Integration**
   - Use SiteGround's CDN service
   - Or integrate Cloudflare

### Deployment Timeline

**Week 1:**
- Set up SiteGround hosting
- Deploy static version
- Test basic functionality

**Week 2:**
- Integrate PHP backend
- Add AI generation endpoint
- Test API integration

**Week 3:**
- Add database support (optional)
- Implement user sessions
- Performance optimization

**Week 4:**
- Security hardening
- Load testing
- Production launch

### Monitoring & Maintenance

1. **Error Logging**
```php
ini_set('log_errors', 1);
ini_set('error_log', '/path/to/error.log');
```

2. **Analytics**
   - Add Google Analytics
   - Monitor API usage
   - Track export counts

3. **Backups**
   - Use SiteGround's automatic backups
   - Schedule database exports

### Cost Estimates

- **SiteGround Hosting:** $3.99-14.99/month
- **Domain (if needed):** $12-15/year
- **Claude API:** $0.003 per 1K input tokens
- **SSL Certificate:** Free with SiteGround
- **Total Monthly:** ~$20-50 depending on usage

### Security Considerations

1. **API Key Protection**
   - Never commit API keys to git
   - Use environment variables
   - Rotate keys regularly

2. **Input Validation**
```php
function sanitizeInput($data) {
    return htmlspecialchars(strip_tags(trim($data)));
}
```

3. **HTTPS Only**
   - Force SSL in .htaccess
   - Use secure cookies

### Support & Documentation

1. Create README for deployment
2. Document API endpoints
3. Add inline code comments
4. Create user guide

This implementation plan provides a complete roadmap for deploying the Creative Preview app on SiteGround with PHP backend support.