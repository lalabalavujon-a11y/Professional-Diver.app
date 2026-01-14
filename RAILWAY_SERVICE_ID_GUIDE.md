# Railway Service ID Configuration Guide

## Important Distinction

**Railway Service URL** (what you provided):
- `professional-diverapp-production.up.railway.app`
- This is the **domain/URL** where your service is accessible
- Used for accessing your application

**Railway Service ID** (what's needed):
- A UUID or short identifier (e.g., `abc123-def456-...`)
- Used by Railway's GraphQL API to query deployment status
- **Different** from the service URL

## How to Find Your Railway Service ID

### Method 1: Railway Dashboard (Easiest)

1. Go to https://railway.app/dashboard
2. Click on your project: **Professional Diver App** (or similar)
3. Click on the service: **professional-diverapp-production**
4. Look at the URL in your browser - it will show something like:
   ```
   https://railway.app/project/[PROJECT_ID]/service/[SERVICE_ID]
   ```
5. The **SERVICE_ID** is the last part of the URL (after `/service/`)
6. Copy that UUID/ID

### Method 2: Railway CLI

If you have Railway CLI installed:

```bash
# Install Railway CLI (if not installed)
npm install -g @railway/cli

# Login to Railway
railway login

# List services in your project
railway service

# Get service details
railway service show
```

### Method 3: Railway GraphQL API

You can query Railway's API directly:

```bash
# Get your Railway API token from: Railway Dashboard → Settings → Tokens

# Query all services in your account
curl -X POST "https://backboard.railway.app/graphql" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_RAILWAY_TOKEN" \
  -d '{"query":"{ me { projects { nodes { name services { nodes { id name url } } } } } }"}'
```

This will return all your projects and services with their IDs.

### Method 4: Check Railway Service Settings

1. Go to Railway dashboard
2. Open your service: **professional-diverapp-production**
3. Click **Settings** tab
4. Scroll down to **Service Info** section
5. Look for **Service ID** or check the URL parameters

## Setting the Service ID in GitHub Secrets

Once you have the Service ID:

1. Go to GitHub: https://github.com/lalabalavujon-a11y/Professional-Diver.app/settings/secrets/actions
2. Click **"New repository secret"**
3. Add **Name**: `RAILWAY_SERVICE_ID`
4. Add **Value**: Your actual service ID (UUID format)
5. Click **"Add secret"**

## Alternative: Use Service URL Instead

The updated workflow now supports using the service URL as an alternative:

1. Go to GitHub Secrets
2. Add **Name**: `RAILWAY_SERVICE_URL`
3. Add **Value**: `professional-diverapp-production.up.railway.app` (or just the service name: `professional-diverapp-production`)
4. The workflow will attempt to look up the service ID automatically

**Note**: Service ID lookup from URL is less reliable - it's better to use the actual Service ID.

## Verify Configuration

After setting the secrets, the purge workflow will:
1. Use `RAILWAY_SERVICE_ID` if set (preferred)
2. Try to look up service ID from `RAILWAY_SERVICE_URL` if service ID not set
3. Fall back to 180 second wait if neither is available

## Current Status

Based on your confirmation:
- **Service URL**: `professional-diverapp-production.up.railway.app` ✅
- **Service ID**: ⚠️ **Still needs to be found and set in GitHub Secrets**

## Next Steps

1. **Find your Railway Service ID** using one of the methods above
2. **Set it in GitHub Secrets** as `RAILWAY_SERVICE_ID`
3. **Optionally** set `RAILWAY_SERVICE_URL` as a backup
4. **Test** the purge workflow by pushing to main again or manually triggering it

The workflow will now work correctly once the Service ID is configured!





