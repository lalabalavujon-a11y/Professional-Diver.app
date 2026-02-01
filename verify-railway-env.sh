#!/bin/bash

# Railway Environment Variables Verification Script
# This script helps verify that both staging and production Railway services
# have the correct environment variables set.

echo "🔍 Railway Environment Variables Verification"
echo "=============================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if jq is installed
if ! command -v jq &> /dev/null; then
    echo -e "${YELLOW}⚠️  jq is not installed. Installing for better output formatting...${NC}"
    echo "   Install with: brew install jq"
    echo ""
fi

echo "📋 Step 1: Testing API Health Endpoints"
echo "---------------------------------------"
echo ""

# Test staging
echo "1. Testing Staging API (staging-api.professionaldiver.app)..."
STAGING_RESPONSE=$(curl -s https://staging-api.professionaldiver.app/health)
STAGING_DB=$(echo "$STAGING_RESPONSE" | jq -r '.services.db' 2>/dev/null || echo "unknown")

if [ "$STAGING_DB" = "postgresql-connected" ]; then
    echo -e "   ${GREEN}✅ Staging DB: $STAGING_DB${NC}"
else
    echo -e "   ${RED}❌ Staging DB: $STAGING_DB${NC}"
    echo "   Full response:"
    echo "$STAGING_RESPONSE" | jq '.' 2>/dev/null || echo "$STAGING_RESPONSE"
fi

echo ""

# Test production
echo "2. Testing Production API (api.professionaldiver.app)..."
PROD_RESPONSE=$(curl -s https://api.professionaldiver.app/health)
PROD_DB=$(echo "$PROD_RESPONSE" | jq -r '.services.db' 2>/dev/null || echo "unknown")

if [ "$PROD_DB" = "postgresql-connected" ]; then
    echo -e "   ${GREEN}✅ Production DB: $PROD_DB${NC}"
else
    echo -e "   ${RED}❌ Production DB: $PROD_DB${NC}"
    echo "   Full response:"
    echo "$PROD_RESPONSE" | jq '.' 2>/dev/null || echo "$PROD_RESPONSE"
fi

echo ""
echo "📋 Step 2: Manual Verification Checklist"
echo "---------------------------------------"
echo ""
echo "Go to Railway Dashboard and verify:"
echo ""
echo "STAGING SERVICE:"
echo "  [ ] DATABASE_URL is set (Supabase Postgres connection string)"
echo "  [ ] SUPABASE_SERVICE_ROLE_KEY is set"
echo "  [ ] NODE_ENV is set to 'production'"
echo "  [ ] OPENAI_API_KEY is set"
echo "  [ ] STRIPE_SECRET_KEY is set (test mode: sk_test_...)"
echo "  [ ] Other API keys as needed"
echo ""
echo "PRODUCTION SERVICE:"
echo "  [ ] DATABASE_URL is set (Supabase Postgres connection string)"
echo "  [ ] SUPABASE_SERVICE_ROLE_KEY is set"
echo "  [ ] NODE_ENV is set to 'production'"
echo "  [ ] OPENAI_API_KEY is set"
echo "  [ ] STRIPE_SECRET_KEY is set (live mode: sk_live_...)"
echo "  [ ] Other API keys as needed"
echo ""
echo "📋 Step 3: Compare Variables"
echo "---------------------------------------"
echo ""
echo "Compare staging and production variables:"
echo "  - DATABASE_URL should be set in BOTH"
echo "  - STRIPE keys should be DIFFERENT (test vs live)"
echo "  - Other keys can be the same"
echo ""

# Summary
echo "📊 Summary"
echo "---------------------------------------"
if [ "$STAGING_DB" = "postgresql-connected" ] && [ "$PROD_DB" = "postgresql-connected" ]; then
    echo -e "${GREEN}✅ Both services are connected to PostgreSQL${NC}"
    echo ""
    echo "Next steps:"
    echo "  1. Verify all required env vars in Railway dashboard"
    echo "  2. Set Cloudflare Pages env vars (see CLOUDFLARE_PAGES_SETUP.md)"
    echo "  3. Test end-to-end flow"
elif [ "$STAGING_DB" = "postgresql-connected" ]; then
    echo -e "${YELLOW}⚠️  Staging is OK, but Production needs attention${NC}"
    echo ""
    echo "Production issues:"
    echo "  - Check DATABASE_URL is set in Railway"
    echo "  - Verify NODE_ENV is 'production'"
    echo "  - Check Railway deployment logs"
elif [ "$PROD_DB" = "postgresql-connected" ]; then
    echo -e "${YELLOW}⚠️  Production is OK, but Staging needs attention${NC}"
    echo ""
    echo "Staging issues:"
    echo "  - Check DATABASE_URL is set in Railway"
    echo "  - Verify NODE_ENV is 'production'"
    echo "  - Check Railway deployment logs"
else
    echo -e "${RED}❌ Both services have database connection issues${NC}"
    echo ""
    echo "Check:"
    echo "  - DATABASE_URL is set in both Railway services"
    echo "  - Supabase database is accessible"
    echo "  - Network/firewall settings allow Railway IPs"
fi

echo ""
echo "📖 For detailed verification steps, see: RAILWAY_ENV_VERIFICATION.md"
