# Remove Old Sales Page from professionaldiver.app

The old sales page at `https://professionaldiver.app` needs to be removed or redirected to the new training app at `https://professional-diver-app.pages.dev`.

## Option 1: Delete the Old Cloudflare Pages Project (Recommended)

1. **Identify the Old Project:**
   - Go to Cloudflare Dashboard → Pages
   - Look for any project that has `professionaldiver.app` as a custom domain
   - Note the project name (it might be different from the new `professional-diver-app` project)

2. **Remove Custom Domain from Old Project:**
   - Click on the old project
   - Go to Custom domains
   - Find `professionaldiver.app` and click "Remove" or "Delete"
   - Confirm the removal

3. **Delete the Old Project (if no longer needed):**
   - Go to Settings → General
   - Scroll down and click "Delete project"
   - Confirm deletion
   - **Warning**: This will permanently delete the old site. Make sure you have backups if needed.

## Option 2: Redirect via Cloudflare Page Rules (Quick Fix)

If you can't delete the old project immediately, create a redirect:

1. **Go to Cloudflare Dashboard:**
   - Select the zone `professionaldiver.app`
   - Go to Rules → Page Rules (or Transform Rules)

2. **Create a Page Rule:**
   ```
   URL Pattern: professionaldiver.app/*
   Setting: Forwarding URL
   Status Code: 301 (Permanent Redirect)
   Destination URL: https://professional-diver-app.pages.dev/$1
   ```

3. **Save the Rule:**
   - Click "Save and Deploy"
   - The redirect will take effect within minutes

## Option 3: Redirect via Transform Rules (Modern Approach)

1. **Go to Cloudflare Dashboard:**
   - Select the zone `professionaldiver.app`
   - Go to Rules → Transform Rules → Dynamic Redirects

2. **Create a Transform Rule:**
   ```
   Rule name: Redirect old site to new site
   When incoming requests match: http.host eq "professionaldiver.app"
   Then: Dynamic redirect
   Status code: 301
   Redirect to: https://professional-diver-app.pages.dev/$1
   ```

3. **Save and Deploy**

## Option 4: Use DNS to Point to New Deployment

1. **Go to Cloudflare Dashboard:**
   - Select the zone `professionaldiver.app`
   - Go to DNS → Records

2. **Update Root Domain (@) Record:**
   - Find the existing `@` CNAME or A record
   - Change the target to: `professional-diver-app.pages.dev`
   - Proxy status: Proxied (orange cloud)
   - Save

3. **Update www Subdomain (if exists):**
   - Find the `www` CNAME record
   - Change the target to: `professional-diver-app.pages.dev`
   - Proxy status: Proxied (orange cloud)
   - Save

4. **Wait for DNS Propagation:**
   - Usually takes 5-10 minutes
   - Test with: `curl -I https://professionaldiver.app`

## Option 5: Use Script (Automated)

You can use the provided script to create a redirect rule via API:

```bash
export CLOUDFLARE_API_TOKEN="your_token_here"
./scripts/redirect-old-site-to-new.sh
```

**Note**: The script requires API token with `Zone.Page Rules` or `Zone.Transform Rules` permissions.

## Verify the Fix

After implementing any option:

1. **Test the redirect:**
   ```bash
   curl -I https://professionaldiver.app
   # Should return: HTTP/2 301 with Location: https://professional-diver-app.pages.dev/
   ```

2. **Test in browser:**
   - Visit `https://professionaldiver.app`
   - Should automatically redirect to `https://professional-diver-app.pages.dev`

3. **Check Cloudflare Pages:**
   - Go to Cloudflare Pages → `professional-diver-app` project
   - Go to Custom domains
   - `professionaldiver.app` should now verify successfully once the old domain is removed

## Troubleshooting

### If custom domain is still "Verifying":
- The old project might still have the domain
- Remove the domain from the old project first
- Then add it to the new project

### If redirect isn't working:
- Check Page Rules priority (they run in order)
- Clear Cloudflare cache
- Wait 5-10 minutes for DNS/propagation

### If you get SSL errors:
- Go to SSL/TLS → Overview
- Set encryption mode to "Full (strict)"
- Wait for SSL certificate to provision (usually 5-10 minutes)

## Recommended Approach

1. **Immediate**: Use Option 2 or 3 (Page Rules or Transform Rules) to redirect traffic
2. **Then**: Use Option 1 to delete the old project and clean up
3. **Finally**: Add `professionaldiver.app` to the new `professional-diver-app` project once old domain is removed

This ensures zero downtime and clean migration.





