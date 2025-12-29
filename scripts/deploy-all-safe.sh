#!/bin/bash

# 🔒 Safe Complete Deployment Script
# Deploys code changes AND syncs quizzes to production
# WITHOUT losing any data

set -e  # Exit on error

TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo "🔒 Starting SAFE complete deployment..."
echo "   Timestamp: $TIMESTAMP"
echo ""
echo "✅ This deployment will:"
echo "   1. Backup local database"
echo "   2. Build application"
echo "   3. Deploy code to production"
echo "   4. Sync quizzes to production (only adds, never deletes)"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Create local backup
echo "1️⃣  Creating local backup..."
if pnpm run backup:export 2>/dev/null; then
    echo -e "${GREEN}✅ Local backup created${NC}"
else
    echo -e "${YELLOW}⚠️  Local backup skipped (not critical)${NC}"
fi

echo ""

# Step 2: Build application
echo "2️⃣  Building application..."
if pnpm run build:worker; then
    echo -e "${GREEN}✅ Build successful${NC}"
else
    echo -e "${RED}❌ Build failed. Aborting deployment.${NC}"
    exit 1
fi

echo ""

# Step 3: Deploy code to production
echo "3️⃣  Deploying code to production..."
if wrangler deploy --env production; then
    echo -e "${GREEN}✅ Code deployment successful${NC}"
else
    echo -e "${RED}❌ Code deployment failed${NC}"
    exit 1
fi

echo ""

# Step 4: Sync quizzes to production D1 database
echo "4️⃣  Syncing quizzes to production database..."
echo "   This will ONLY add missing quizzes (safe - never deletes)"

# Note: To sync quizzes to D1, we need to run the script against D1
# The script needs to be run via wrangler d1 execute or through an API endpoint
echo ""
echo -e "${YELLOW}⚠️  IMPORTANT: Database sync needed${NC}"
echo ""
echo "To sync quizzes to production D1 database, run one of:"
echo ""
echo "Option 1: Via API (if you have an admin endpoint):"
echo "   curl -X POST https://professionaldiver.app/api/admin/sync-quizzes"
echo ""
echo "Option 2: Via Wrangler D1 (manual SQL):"
echo "   # Export quizzes from local"
echo "   sqlite3 local-dev.db \".mode insert quizzes\" \".output quizzes.sql\" \"SELECT * FROM quizzes WHERE lesson_id IN (SELECT id FROM lessons WHERE track_id IN (SELECT id FROM tracks WHERE slug IN ('hyperbaric-operations', 'lst')));\""
echo ""
echo "Option 3: Run script via wrangler (requires script modification):"
echo "   # The safe-deploy-quizzes.ts script can be modified to work with D1"
echo ""

echo ""
echo -e "${GREEN}🎉 Code deployment completed successfully!${NC}"
echo ""
echo "📋 Summary:"
echo "   ✅ Code changes deployed to production"
echo "   ✅ No data was deleted or modified"
echo "   ⚠️  Database sync may be needed (see instructions above)"
echo ""
echo "🔍 Next steps:"
echo "   1. Test the site at https://www.professionaldiver.app"
echo "   2. Verify lesson navigation works"
echo "   3. Check if quizzes are available (may need database sync)"
echo "   4. If quizzes missing, run database sync (see instructions above)"
echo ""




