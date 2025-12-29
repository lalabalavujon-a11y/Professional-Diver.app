#!/bin/bash

# Find Express Server Deployment Script
# Tests common deployment platforms to find where Express server is hosted

echo "🔍 Searching for Express Server Deployment..."
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Common deployment URL patterns to test
declare -a urls=(
    # Railway patterns
    "https://professionaldiver-api.railway.app"
    "https://professional-diver-api.railway.app"
    "https://professionaldiver-training-api.railway.app"
    "https://diverwell-api.railway.app"
    
    # Render patterns
    "https://professionaldiver-api.onrender.com"
    "https://professional-diver-api.onrender.com"
    "https://professionaldiver-training-api.onrender.com"
    "https://diverwell-api.onrender.com"
    
    # Fly.io patterns
    "https://professionaldiver-api.fly.dev"
    "https://professional-diver-api.fly.dev"
    "https://professionaldiver-training-api.fly.dev"
    
    # Vercel patterns
    "https://professional-diver-training-api.vercel.app"
    "https://professionaldiver-api.vercel.app"
    
    # Generic patterns
    "https://api.professionaldiver.app"
    "https://api.professional-diver.app"
)

echo "Testing common deployment URLs..."
echo ""

found_count=0
for url in "${urls[@]}"; do
    echo -n "Testing $url... "
    
    # Test /health endpoint
    status=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "$url/health" 2>/dev/null)
    
    if [ "$status" = "200" ]; then
        echo -e "${GREEN}✅ FOUND! (HTTP $status)${NC}"
        
        # Try to get health response
        health_response=$(curl -s --max-time 5 "$url/health" 2>/dev/null)
        echo "   Response: $health_response"
        
        # Test /api/health
        api_status=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "$url/api/health" 2>/dev/null)
        if [ "$api_status" = "200" ]; then
            echo -e "   ${GREEN}✅ /api/health also works!${NC}"
        fi
        
        echo ""
        echo -e "${BLUE}📋 Next Steps:${NC}"
        echo "1. Update API_URL in Cloudflare Workers:"
        echo "   wrangler secret put API_URL --env production"
        echo "   (Enter: $url)"
        echo ""
        echo "2. Test the connection:"
        echo "   curl https://professionaldiver.app/api/health"
        echo ""
        
        found_count=$((found_count + 1))
    elif [ "$status" = "404" ]; then
        echo -e "${YELLOW}⚠️  Exists but /health not found (HTTP $status)${NC}"
        found_count=$((found_count + 1))
    elif [ "$status" = "000" ] || [ -z "$status" ]; then
        echo -e "${RED}❌ Not accessible${NC}"
    else
        echo -e "${YELLOW}⚠️  HTTP $status${NC}"
    fi
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ $found_count -eq 0 ]; then
    echo -e "${RED}❌ No Express server found at common URLs${NC}"
    echo ""
    echo "The Express server might be:"
    echo "1. Not deployed yet"
    echo "2. Deployed with a different URL"
    echo "3. Deployed on a platform not tested"
    echo ""
    echo "📋 Manual Check Instructions:"
    echo ""
    echo "1. Check Railway Dashboard:"
    echo "   https://railway.app/dashboard"
    echo "   - Look for services named 'professionaldiver' or 'api'"
    echo "   - Check the service URL in the settings"
    echo ""
    echo "2. Check Render Dashboard:"
    echo "   https://dashboard.render.com"
    echo "   - Look for web services"
    echo "   - Check the service URL"
    echo ""
    echo "3. Check Fly.io:"
    echo "   fly apps list"
    echo "   fly status"
    echo ""
    echo "4. Check Vercel Dashboard:"
    echo "   https://vercel.com/dashboard"
    echo "   - Look for projects"
    echo ""
    echo "5. Check Cloudflare Dashboard for API_URL:"
    echo "   https://dash.cloudflare.com"
    echo "   - Workers & Pages → professionaldiver-app-production"
    echo "   - Settings → Variables"
    echo "   - Look for API_URL value (you can't read it, but you can update it)"
else
    echo -e "${GREEN}✅ Found $found_count potential Express server(s)${NC}"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""





