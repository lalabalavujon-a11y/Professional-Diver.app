# Automatic Deployment Setup

## ✅ Workflow Created

The automatic deployment workflow has been created at `.github/workflows/deploy.yml`.

## 🔐 Required GitHub Secrets

To enable automatic deployments, ensure these secrets are configured in GitHub:

### Cloudflare Secrets (Required for Deployments)

1. **`CLOUDFLARE_API_TOKEN`**
   - Get from: https://dash.cloudflare.com/profile/api-tokens
   - Create token with template: "Edit Cloudflare Workers"
   - Permissions needed:
     - Account → Cloudflare Workers → Edit
     - Zone → Zone → Read (if using routes)

2. **`CLOUDFLARE_ACCOUNT_ID`**
   - Get from: https://dash.cloudflare.com (right sidebar → Account ID)
   - Or run locally: `wrangler whoami` (shows account ID)

### Email Campaign Secrets (Already Configured ✅)

These should already be set for email campaigns:
- `SMTP_PASSWORD` - Google Workspace app password
- `DATABASE_URL` - Database connection string
- `SENDGRID_API_KEY` - SendGrid API key (optional)

## 🔍 How to Verify/Add Secrets

1. Go to your GitHub repository
2. Navigate to: **Settings** → **Secrets and variables** → **Actions**
3. Check if `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` exist
4. If missing, click **"New repository secret"** and add them

## 🚀 How It Works

### Automatic Deployment
- **Trigger**: On every push to `main` branch
- **Steps**:
  1. Install dependencies
  2. Build worker
  3. Export backup (optional, continues on error)
  4. Deploy Main Worker (`professionaldiver-app-production`)
  5. Deploy API Worker (`professionaldiver-api-production`)

### Manual Deployment
- **Trigger**: Go to **Actions** tab → **Deploy to Cloudflare** → **Run workflow**

## 📊 Deployment Status

View deployment status at:
- GitHub: https://github.com/YOUR_USERNAME/YOUR_REPO/actions
- Filter by workflow: "Deploy to Cloudflare"

## ⚠️ Important Notes

1. **Backup Script**: The backup export step will continue even if it fails (CI environment may not have database access)
2. **Two Workers**: Both main app and API workers are deployed
3. **Production Only**: Currently deploys to production environment only
4. **Main Branch Only**: Only pushes to `main` trigger automatic deployments

## 🔧 Troubleshooting

### "Missing CLOUDFLARE_API_TOKEN"
- Add the secret in GitHub repository settings
- Ensure token has correct permissions

### "Missing CLOUDFLARE_ACCOUNT_ID"
- Add the secret in GitHub repository settings
- Get account ID from Cloudflare dashboard or `wrangler whoami`

### Deployment Fails
- Check GitHub Actions logs for specific errors
- Verify wrangler.toml configuration is correct
- Ensure Cloudflare API token is valid and has required permissions

