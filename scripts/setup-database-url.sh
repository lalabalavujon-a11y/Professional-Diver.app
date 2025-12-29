#!/bin/bash

# Interactive script to set up DATABASE_URL in Cloudflare Workers
# This script will guide you through setting up the DATABASE_URL secret

set -e

echo "🔧 Setting up DATABASE_URL for Cloudflare Workers"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo -e "${RED}❌ Wrangler CLI is not installed${NC}"
    echo "   Install it with: npm install -g wrangler"
    exit 1
fi

echo "📋 This script will help you set DATABASE_URL in Cloudflare Workers"
echo ""
echo "You'll need your PostgreSQL connection string."
echo "It should look like: postgresql://user:password@host:port/database?sslmode=require"
echo ""
echo "Where to find it:"
echo "  • Neon: Dashboard → Project → Connection String"
echo "  • Supabase: Dashboard → Project Settings → Database → Connection String"
echo "  • Railway: Service → Variables → DATABASE_URL"
echo "  • Other: Check your database provider's dashboard"
echo ""

# Check if DATABASE_URL is already set
echo "Checking current secrets..."
MAIN_SECRETS=$(wrangler secret list --env production 2>&1 | grep -i "DATABASE_URL" || echo "")
API_SECRETS=$(wrangler secret list --config wrangler-api.toml --env production 2>&1 | grep -i "DATABASE_URL" || echo "")

if [ -n "$MAIN_SECRETS" ] || [ -n "$API_SECRETS" ]; then
    echo -e "${YELLOW}⚠️  DATABASE_URL appears to already be set${NC}"
    read -p "Do you want to update it? (y/N): " update_choice
    if [[ ! $update_choice =~ ^[Yy]$ ]]; then
        echo "Skipping DATABASE_URL setup."
        exit 0
    fi
fi

# Get DATABASE_URL from user
echo ""
read -p "Enter your PostgreSQL connection string: " db_url

if [ -z "$db_url" ]; then
    echo -e "${RED}❌ DATABASE_URL cannot be empty${NC}"
    exit 1
fi

# Validate format
if [[ ! "$db_url" =~ ^postgresql:// ]]; then
    echo -e "${YELLOW}⚠️  Warning: Connection string should start with 'postgresql://'${NC}"
    read -p "Continue anyway? (y/N): " continue_choice
    if [[ ! $continue_choice =~ ^[Yy]$ ]]; then
        echo "Aborted."
        exit 1
    fi
fi

# Set for main worker
echo ""
echo "Setting DATABASE_URL for main worker (professionaldiver-app-production)..."
echo "$db_url" | wrangler secret put DATABASE_URL --env production

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ DATABASE_URL set for main worker${NC}"
else
    echo -e "${RED}❌ Failed to set DATABASE_URL for main worker${NC}"
    exit 1
fi

# Ask about API worker
echo ""
read -p "Do you also want to set DATABASE_URL for the API worker? (Y/n): " api_choice
if [[ ! $api_choice =~ ^[Nn]$ ]]; then
    echo "Setting DATABASE_URL for API worker (professionaldiver-api-production)..."
    echo "$db_url" | wrangler secret put DATABASE_URL --config wrangler-api.toml --env production
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ DATABASE_URL set for API worker${NC}"
    else
        echo -e "${YELLOW}⚠️  Failed to set DATABASE_URL for API worker (may not be needed)${NC}"
    fi
fi

# Verify
echo ""
echo "Verifying configuration..."
echo ""
echo "Main worker secrets:"
wrangler secret list --env production

echo ""
echo "API worker secrets:"
wrangler secret list --config wrangler-api.toml --env production 2>&1 || echo "API worker may not be configured"

echo ""
echo -e "${GREEN}✅ DATABASE_URL setup complete!${NC}"
echo ""
echo "Next steps:"
echo "  1. Verify: NODE_ENV=production DATABASE_URL=\"$db_url\" pnpm run deploy:verify production"
echo "  2. Create backup: NODE_ENV=production DATABASE_URL=\"$db_url\" pnpm run backup:full"
echo "  3. Deploy: DATABASE_URL=\"$db_url\" ./scripts/safe-deploy.sh production"





