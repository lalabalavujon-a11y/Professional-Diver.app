#!/bin/bash

# Quick deployment verification script
# Run this after setting up Railway services and Cloudflare Pages env vars

echo "🔍 Testing Railway Services..."
echo ""

# Test production API
echo "1. Testing Production API (api.professionaldiver.app)..."
PROD_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" https://api.professionaldiver.app/health)
if [ "$PROD_RESPONSE" = "200" ]; then
  echo "   ✅ Production API is online"
  curl -s https://api.professionaldiver.app/health | jq '.' 2>/dev/null || curl -s https://api.professionaldiver.app/health
else
  echo "   ❌ Production API returned: $PROD_RESPONSE"
fi

echo ""

# Test staging API
echo "2. Testing Staging API (staging-api.professionaldiver.app)..."
STAGING_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" https://staging-api.professionaldiver.app/health)
if [ "$STAGING_RESPONSE" = "200" ]; then
  echo "   ✅ Staging API is online"
  curl -s https://staging-api.professionaldiver.app/health | jq '.' 2>/dev/null || curl -s https://staging-api.professionaldiver.app/health
else
  echo "   ❌ Staging API returned: $STAGING_RESPONSE"
fi

echo ""
echo "📋 Next Steps:"
echo "   1. Set Cloudflare Pages env vars (see CLOUDFLARE_PAGES_SETUP.md)"
echo "   2. Create a test PR to verify preview deployments"
echo "   3. Verify production deployment after merge to main"
