# CloudFlare Deployment Guide for Professional Diver - Diver Well Training

## Setting up CloudFlare for https://professional-diver.diverwell.app

### Prerequisites
- CloudFlare account
- Domain ownership verification for diverwell.app
- Replit Core or higher plan for custom domains

### Step 1: CloudFlare Domain Configuration

1. **Add Domain to CloudFlare:**
   - Log in to CloudFlare dashboard
   - Click "Add a Site" 
   - Enter `diverwell.app`
   - Select plan (Free plan works for basic setup)
   - CloudFlare will scan existing DNS records

2. **Update Nameservers:**
   - Copy the CloudFlare nameservers provided
   - Update nameservers at your domain registrar to point to CloudFlare
   - Wait for propagation (usually 24-48 hours)

### Step 2: DNS Configuration

3. **Add Subdomain Record:**
   ```
   Type: CNAME
   Name: professional-diver
   Target: <your-replit-url>.replit.dev
   Proxy Status: Proxied (orange cloud)
   TTL: Auto
   ```

4. **SSL/TLS Settings:**
   - Go to SSL/TLS → Overview
   - Set encryption mode to "Full (strict)" for production
   - Enable "Always Use HTTPS"

### Step 3: Replit Domain Configuration

5. **Configure Custom Domain in Replit:**
   - Open your Replit project
   - Go to the webview/preview
   - Click on the URL bar and select "Custom domains"
   - Add `professional-diver.diverwell.app`
   - Follow Replit's verification process

### Step 4: CloudFlare Performance & Security

6. **Performance Optimization:**
   - Enable "Auto Minify" for CSS, HTML, JS
   - Enable "Brotli" compression
   - Set Browser Cache TTL to appropriate value
   - Enable "Always Online"

7. **Security Configuration:**
   - Enable "Security Level: Medium"
   - Configure "Challenge Passage" to 30 minutes
   - Enable "Browser Integrity Check"
   - Set up "Rate Limiting" if needed

### Step 5: Page Rules & Redirects

8. **Create Page Rules:**
   ```
   Rule 1: Redirect www to non-www
   URL: www.professional-diver.diverwell.app/*
   Setting: Forwarding URL (Status Code: 301, Destination: https://professional-diver.diverwell.app/$1)

   Rule 2: Force HTTPS
   URL: http://professional-diver.diverwell.app/*
   Setting: Always Use HTTPS
   ```

### Step 6: Additional Configuration

9. **HTTP/2 & HTTP/3:**
   - Enable HTTP/2 and HTTP/3 in Network settings
   - Enable "0-RTT Connection Resumption"

10. **Analytics Setup:**
    - Enable CloudFlare Web Analytics
    - Configure custom analytics if needed

### Step 7: Email Marketing Integration

11. **Email Routing (Optional):**
    - Set up email routing for support@diverwell.app
    - Configure SPF/DKIM records for email marketing
    - Add MX records if using CloudFlare email routing

### Step 8: Testing & Verification

12. **Domain Verification:**
    ```bash
    # Test DNS resolution
    nslookup professional-diver.diverwell.app
    
    # Test SSL certificate
    openssl s_client -connect professional-diver.diverwell.app:443 -servername professional-diver.diverwell.app
    
    # Test HTTP to HTTPS redirect
    curl -I http://professional-diver.diverwell.app
    ```

13. **Performance Testing:**
    - Use CloudFlare's Speed Test
    - Test with Google PageSpeed Insights
    - Verify all resources load correctly

### Environment Variables Update

14. **Update Application Configuration:**
    ```env
    # Add to Replit Secrets
    SITE_URL=https://professional-diver.diverwell.app
    REPLIT_DOMAINS=professional-diver.diverwell.app
    ```

### Monitoring & Maintenance

15. **Set up CloudFlare Monitoring:**
    - Configure uptime monitoring
    - Set up email alerts for downtime
    - Monitor traffic analytics

16. **Regular Maintenance:**
    - Review security logs monthly
    - Update firewall rules as needed
    - Monitor performance metrics

## Troubleshooting Common Issues

### DNS Propagation Delays
- Use `dig` or `nslookup` to check propagation
- Clear DNS cache: `ipconfig /flushdns` (Windows) or `sudo dscacheutil -flushcache` (Mac)

### SSL Certificate Issues
- Ensure CloudFlare SSL mode is "Full (strict)"
- Verify Replit is generating SSL certificates for custom domain
- Check for mixed content warnings

### Replit Connection Issues
- Verify the Replit project is running
- Check custom domain configuration in Replit
- Ensure the application binds to 0.0.0.0:5000

### Performance Issues
- Enable CloudFlare caching for static assets
- Optimize images and minimize HTTP requests
- Use CloudFlare's Polish feature for image optimization

## Security Best Practices

1. **Enable CloudFlare Security Features:**
   - Bot Fight Mode for basic bot protection
   - Rate limiting for API endpoints
   - WAF rules for common attacks

2. **Content Security Policy:**
   - Add CSP headers for XSS protection
   - Whitelist trusted domains only

3. **Regular Updates:**
   - Keep Replit runtime updated
   - Monitor security advisories
   - Review access logs regularly

## Success Verification

Once completed, verify:
- ✅ https://professional-diver.diverwell.app loads correctly
- ✅ HTTP redirects to HTTPS
- ✅ SSL certificate is valid and trusted
- ✅ All features work (trial signup, AI consultant, payment links)
- ✅ Email marketing functions properly
- ✅ Performance is optimized with CloudFlare
- ✅ Analytics and monitoring are configured

This setup provides enterprise-grade performance, security, and reliability for the Professional Diver platform through CloudFlare's global CDN network.