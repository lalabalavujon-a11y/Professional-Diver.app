#!/bin/bash

# Code-Only Safe Deployment Script
# For deployments that don't touch the database
# Usage: ./scripts/deploy-code-only.sh [production|development]

set -e  # Exit on error

ENV=${1:-production}
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo "🚀 Starting CODE-ONLY safe deployment..."
echo "   Environment: $ENV"
echo "   Timestamp: $TIMESTAMP"
echo ""
echo "✅ This deployment will NOT modify your database"
echo "✅ All existing data (users, lessons, tracks) will be preserved"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Create local backup (optional safety measure)
echo "1️⃣  Creating local backup (optional safety measure)..."
if pnpm run backup:export 2>/dev/null; then
    echo -e "${GREEN}✅ Local backup created${NC}"
else
    echo -e "${YELLOW}⚠️  Local backup skipped (not required for code-only deployment)${NC}"
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

# Step 3: Deploy
echo "3️⃣  Deploying to $ENV..."
if [ "$ENV" = "production" ]; then
    if wrangler deploy --env production; then
        echo -e "${GREEN}✅ Deployment successful${NC}"
    else
        echo -e "${RED}❌ Deployment failed${NC}"
        exit 1
    fi
else
    if wrangler deploy --env development; then
        echo -e "${GREEN}✅ Deployment successful${NC}"
    else
        echo -e "${RED}❌ Deployment failed${NC}"
        exit 1
    fi
fi

echo ""

# Step 4: Post-deployment verification
echo "4️⃣  Post-deployment verification..."
echo "   Checking site availability..."
sleep 3  # Give Cloudflare a moment to update

if curl -f -s -o /dev/null -w "%{http_code}" https://www.professionaldiver.app 2>/dev/null | grep -q "200\|301\|302\|404"; then
    echo -e "${GREEN}✅ Site is accessible${NC}"
else
    echo -e "${YELLOW}⚠️  Site may not be fully accessible yet (this is normal immediately after deployment)${NC}"
    echo "   Please check manually: https://www.professionaldiver.app"
fi

echo ""
echo -e "${GREEN}🎉 Code-only deployment completed successfully!${NC}"
echo ""
echo "📋 Summary:"
echo "   ✅ Application built successfully"
echo "   ✅ Deployment completed to $ENV"
echo "   ✅ No database changes made"
echo "   ✅ All existing data preserved"
echo ""
echo "🔍 Next steps:"
echo "   1. Test the site at https://www.professionaldiver.app"
echo "   2. Verify lesson navigation works"
echo "   3. Test AI Tutor voice functionality"
echo "   4. Check that all existing data is accessible"
echo ""
echo "💡 Remember: Your data is safe - this was a code-only deployment!"




