#!/bin/bash
# Interactive DNS configuration script

echo "🔧 Cloudflare DNS Configuration for professionaldiver.app"
echo ""

# Check if token is already set
if [ -z "$CLOUDFLARE_API_TOKEN" ]; then
    echo "Please enter your Cloudflare API Token:"
    echo "(Get it from: https://dash.cloudflare.com/profile/api-tokens)"
    read -s CLOUDFLARE_API_TOKEN
    export CLOUDFLARE_API_TOKEN
    echo ""
fi

if [ -z "$CLOUDFLARE_API_TOKEN" ]; then
    echo "❌ API Token is required"
    exit 1
fi

echo "✅ Using API Token (${CLOUDFLARE_API_TOKEN:0:10}...)"
echo ""

# Run the TypeScript script
node --import tsx/esm scripts/configure-dns-api.ts








