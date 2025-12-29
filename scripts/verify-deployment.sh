#!/bin/bash

# Deployment Verification Script
# Checks if Express server is properly connected

echo "🔍 Verifying Deployment Configuration..."
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check 1: Site Accessibility
echo "1. Checking site accessibility..."
SITE_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://professionaldiver.app/health)
if [ "$SITE_STATUS" = "200" ]; then
    echo -e "${GREEN}✅ Site is accessible (HTTP $SITE_STATUS)${NC}"
else
    echo -e "${RED}❌ Site returned HTTP $SITE_STATUS${NC}"
fi
echo ""

# Check 2: API Endpoint
echo "2. Checking API endpoint..."
API_RESPONSE=$(curl -s https://professionaldiver.app/api/health)
if echo "$API_RESPONSE" | grep -q "Not implemented"; then
    echo -e "${RED}❌ API endpoint returns 'Not implemented'${NC}"
    echo "   This means Express server is NOT connected"
    echo ""
    echo "   Possible causes:"
    echo "   - Express server not deployed"
    echo "   - API_URL secret points to wrong URL"
    echo "   - Express server not running"
    echo "   - DATABASE_URL not configured in Express server"
else
    echo -e "${GREEN}✅ API endpoint responding correctly${NC}"
    echo "   Response: $API_RESPONSE"
fi
echo ""

# Check 3: API_URL Secret
echo "3. Checking API_URL secret..."
if wrangler secret list --env production 2>/dev/null | grep -q "API_URL"; then
    echo -e "${GREEN}✅ API_URL secret is configured${NC}"
    echo -e "${YELLOW}⚠️  Cannot read secret value (Wrangler security)${NC}"
    echo "   To update: wrangler secret put API_URL --env production"
else
    echo -e "${RED}❌ API_URL secret is NOT configured${NC}"
    echo "   Run: wrangler secret put API_URL --env production"
fi
echo ""

# Check 4: Instructions
echo "📋 Next Steps:"
echo ""
echo "1. Find your Express server URL:"
echo "   - Check Railway/Render/Fly.io dashboard"
echo "   - Look for deployed service URL"
echo ""
echo "2. Test Express server directly:"
echo "   curl https://your-express-server-url/health"
echo ""
echo "3. Verify DATABASE_URL in Express server:"
echo "   - Railway: Dashboard → Service → Variables"
echo "   - Render: Dashboard → Service → Environment"
echo "   - Fly.io: fly secrets list"
echo ""
echo "4. Update API_URL if needed:"
echo "   wrangler secret put API_URL --env production"
echo ""
echo "5. Test connection:"
echo "   curl https://professionaldiver.app/api/health"
echo "   (Should NOT return 'Not implemented')"
echo ""





