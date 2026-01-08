#!/bin/bash
# Script to redirect old sales page (professionaldiver.app) to new site
# This creates a Cloudflare Transform Rule to redirect all traffic

set -e

CLOUDFLARE_API_TOKEN="${CLOUDFLARE_API_TOKEN:-}"
ZONE_ID="${ZONE_ID:-}"

if [ -z "$CLOUDFLARE_API_TOKEN" ]; then
  echo "❌ Error: CLOUDFLARE_API_TOKEN environment variable is required"
  exit 1
fi

if [ -z "$ZONE_ID" ]; then
  echo "🔍 Fetching Zone ID for professionaldiver.app..."
  ZONE_ID=$(curl -s -X GET "https://api.cloudflare.com/client/v4/zones?name=professionaldiver.app" \
    -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
    -H "Content-Type: application/json" | jq -r '.result[0].id')
  
  if [ "$ZONE_ID" = "null" ] || [ -z "$ZONE_ID" ]; then
    echo "❌ Error: Could not find Zone ID for professionaldiver.app"
    exit 1
  fi
fi

echo "✅ Found Zone ID: $ZONE_ID"

echo "📋 Creating Redirect Rule to redirect professionaldiver.app to new site..."

# Create a URL Rewrite rule to redirect all traffic from old site to new site
RULE_DATA=$(cat <<EOF
{
  "action": "redirect",
  "action_parameters": {
    "from": {
      "value": "https://professionaldiver.app/*"
    },
    "to": {
      "value": "https://professional-diver-app.pages.dev/\$1",
      "status_code": 301
    }
  },
  "expression": "(http.request.uri.path ne \"/\" or http.request.uri.path eq \"/\") and http.host eq \"professionaldiver.app\"",
  "description": "Redirect old sales page to new training app"
}
EOF
)

RESPONSE=$(curl -s -X POST "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/rulesets/phases/http_request_dynamic_redirect/entrypoint" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -H "Content-Type: application/json" \
  --data "$RULE_DATA")

SUCCESS=$(echo "$RESPONSE" | jq -r '.success')

if [ "$SUCCESS" = "true" ]; then
  echo "✅ Redirect rule created successfully!"
  echo "Response: $RESPONSE"
else
  echo "❌ Error creating redirect rule: $RESPONSE"
  exit 1
fi

echo ""
echo "🔄 Alternative: Using Page Rules (simpler approach)"
echo "If Transform Rules don't work, use this Page Rule in Cloudflare Dashboard:"
echo ""
echo "URL Pattern: professionaldiver.app/*"
echo "Setting: Forwarding URL"
echo "Status Code: 301 (Permanent Redirect)"
echo "Destination URL: https://professional-diver-app.pages.dev/\$1"
echo ""

