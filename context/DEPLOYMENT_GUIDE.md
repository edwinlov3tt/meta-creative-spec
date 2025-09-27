# Deployment Guide for SiteGround

## Pre-Deployment Checklist

### Files Created/Modified
✅ `.env` - Contains API keys (created from .env.local)
✅ `config/config.php` - Configuration loader
✅ `api/generate-copy.php` - Claude API integration
✅ `api/facebook-page.php` - Facebook API integration  
✅ `.htaccess` - Security headers and rules
✅ `app.js` - AI integration already added
✅ `styles.css` - Loading states already added

## Deployment Steps for SiteGround

### 1. Prepare Files for Upload

**IMPORTANT: Remove sensitive data before upload:**
```bash
# Remove .env file (will configure via SiteGround panel)
rm .env
rm .env.local

# Update config for production
# Edit config/config.php and change:
# 'environment' => 'development' to 'environment' => getenv('ENVIRONMENT') ?: 'production'
```

### 2. Upload Files to SiteGround

1. Log into SiteGround Site Tools
2. Go to **File Manager**
3. Navigate to your public_html or subdomain folder
4. Upload the entire project folder
5. Ensure these folders/files are uploaded:
   - `/api/` folder with both PHP files
   - `/config/` folder with config.php
   - `.htaccess` file
   - All HTML, CSS, JS files
   - `/ad-mockups/` folder (if needed)

### 3. Configure Environment Variables in SiteGround

1. In Site Tools, go to **Devs > Environment Variables**
2. Add these variables:
   ```
   CLAUDE_API_KEY = 
   FACEBOOK_APP_ID = 
   FACEBOOK_APP_SECRET = 
   ENVIRONMENT = 
   ```

### 4. Update Production Settings

1. Edit `.htaccess` via File Manager and uncomment HTTPS redirect:
   ```apache
   # Force HTTPS in production (uncomment when deployed to SiteGround)
   RewriteCond %{HTTPS} !=on
   RewriteRule ^(.*)$ https://%{HTTP_HOST}/$1 [R=301,L]
   ```

2. Update `config/config.php`:
   ```php
   'environment' => getenv('ENVIRONMENT') ?: 'production'
   ```

3. Remove test mode from `api/facebook-page.php` (lines 52-62)

### 5. Test the Deployment

1. Visit your site: `https://yourdomain.com/creative-preview/`
2. Test the Generate Ad Copy button:
   - Fill in Website, Company Overview, and Objective
   - Click "Generate Ad Copy" 
   - Should show loading spinner and grey out Step 2 fields
   - Should receive AI-generated copy including Ad Name in ~3-5 seconds
   - All fields in Step 2 should be populated automatically

3. Test Facebook integration (multiple fallback methods):
   - Enter a Facebook page URL (e.g., https://facebook.com/nike)
   - Should instantly show extracted brand name from URL
   - Should enhance with better data from server (if available)
   - Test fallback: Enter invalid Facebook URL + valid website URL
   - Should fall back to website domain name and favicon

### 6. Security Verification

1. Verify these URLs return 403 Forbidden:
   - `https://yourdomain.com/creative-preview/.env`
   - `https://yourdomain.com/creative-preview/config/config.php`

2. Check PHP error logs in Site Tools > Statistics > Error Log

### 7. Performance Optimization (Optional)

In Site Tools:
1. Enable **Static Cache** for HTML/CSS/JS files
2. Enable **Dynamic Cache** for PHP (exclude /api/* paths)
3. Enable **Memcached** if available
4. Set up **CDN** via Cloudflare integration

## Troubleshooting

### API Not Working
- Check error logs: Site Tools > Statistics > Error Log
- Verify environment variables are set correctly
- Check file permissions (should be 644 for files, 755 for folders)

### Facebook API Issues
- **NEW**: Multi-method fallback system implemented
- Method 1: Instant client-side URL parsing (always works)
- Method 2: Open Graph meta tag scraping
- Method 3: Facebook oEmbed API (public, no auth needed)
- Method 4: Graph API (requires app review for production)
- Method 5: Domain fallback using website favicon and formatted domain name
- No Facebook app review needed for basic functionality!

### Rate Limiting
- Session-based rate limiting: 20 requests per hour per user
- Increase if needed in `api/generate-copy.php` line 23

### CORS Issues
- `.htaccess` already configured for CORS
- If issues persist, check SiteGround's ModSecurity settings

## Monitoring

### Set up monitoring:
1. Enable error logging in Site Tools
2. Monitor API usage via error logs (grep for "API_USAGE")
3. **NEW**: Check Facebook API logs at `/logs/facebook_requests.csv` and `/logs/facebook_requests.json`
4. Set up uptime monitoring (e.g., UptimeRobot)

## Cost Estimates

- **Claude API**: ~$0.015 per generation
- **1000 generations/month**: ~$15
- **Facebook API**: Free for basic page info
- **Total monthly cost**: $5-25 depending on usage

## Support

For issues:
1. Check PHP error logs
2. Test API endpoints directly with curl
3. Verify all environment variables are set
4. Contact SiteGround support for server-specific issues

## Important Notes

1. **Never commit .env files to version control**
2. **Rotate API keys regularly**
3. **Monitor usage to prevent unexpected charges**
4. **Keep the Facebook app in development mode until ready for production**
5. **Test thoroughly before going live**

## Quick Test Commands

Test from command line after deployment:

```bash
# Test Claude API
curl -X POST https://yourdomain.com/creative-preview/api/generate-copy.php \
  -H "Content-Type: application/json" \
  -d '{
    "website": "https://example.com",
    "companyOverview": "Test company",
    "objective": "Drive sales"
  }'

# Test Facebook API
curl -X POST https://yourdomain.com/creative-preview/api/facebook-page.php \
  -H "Content-Type: application/json" \
  -d '{
    "facebookUrl": "https://facebook.com/nike"
  }'
```

Both should return JSON responses with success: true.