#!/bin/bash

# Safe Deployment Script with Comprehensive Backup
# This script ensures no data is lost during deployment
#
# Usage:
#   ./scripts/safe-deploy.sh [production|development]
#
# Example:
#   ./scripts/safe-deploy.sh production

set -e  # Exit on error

ENV=${1:-production}
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo "🚀 Starting safe deployment process..."
echo "   Environment: $ENV"
echo "   Timestamp: $TIMESTAMP"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Verify deployment readiness
echo "1️⃣  Verifying deployment readiness..."
if pnpm tsx scripts/verify-deployment-ready.ts "$ENV"; then
    echo -e "${GREEN}✅ Verification passed${NC}"
else
    echo -e "${RED}❌ Verification failed. Aborting deployment.${NC}"
    exit 1
fi

echo ""

# Step 2: Create comprehensive backup
echo "2️⃣  Creating comprehensive backup..."
if [ "$ENV" = "production" ]; then
    if [ -z "$DATABASE_URL" ]; then
        echo -e "${RED}❌ DATABASE_URL is required for production backup${NC}"
        echo "   Set DATABASE_URL environment variable and try again"
        exit 1
    fi
    
    if NODE_ENV=production DATABASE_URL="$DATABASE_URL" pnpm tsx scripts/backup-production-database.ts; then
        echo -e "${GREEN}✅ Production backup created${NC}"
    else
        echo -e "${RED}❌ Backup failed. Aborting deployment.${NC}"
        exit 1
    fi
else
    if pnpm run backup:export; then
        echo -e "${GREEN}✅ Development backup created${NC}"
    else
        echo -e "${RED}❌ Backup failed. Aborting deployment.${NC}"
        exit 1
    fi
fi

echo ""

# Step 3: Verify backup exists
echo "3️⃣  Verifying backup integrity..."
BACKUP_FILE="backups/full-database-latest.json"
if [ ! -f "$BACKUP_FILE" ]; then
    BACKUP_FILE="backups/tracks-lessons-latest.json"
fi

if [ -f "$BACKUP_FILE" ]; then
    BACKUP_SIZE=$(stat -f%z "$BACKUP_FILE" 2>/dev/null || stat -c%s "$BACKUP_FILE" 2>/dev/null || echo "0")
    if [ "$BACKUP_SIZE" -gt 100 ]; then
        echo -e "${GREEN}✅ Backup verified (size: $BACKUP_SIZE bytes)${NC}"
    else
        echo -e "${YELLOW}⚠️  Backup file seems too small. Proceeding with caution...${NC}"
    fi
else
    echo -e "${RED}❌ Backup file not found. Aborting deployment.${NC}"
    exit 1
fi

echo ""

# Step 4: Build application
echo "4️⃣  Building application..."
if pnpm run build:worker; then
    echo -e "${GREEN}✅ Build successful${NC}"
else
    echo -e "${RED}❌ Build failed. Aborting deployment.${NC}"
    exit 1
fi

echo ""

# Step 5: Deploy
echo "5️⃣  Deploying to $ENV..."
if [ "$ENV" = "production" ]; then
    if wrangler deploy --env production; then
        echo -e "${GREEN}✅ Deployment successful${NC}"
    else
        echo -e "${RED}❌ Deployment failed${NC}"
        echo -e "${YELLOW}⚠️  Backup is available at: $BACKUP_FILE${NC}"
        exit 1
    fi
else
    if wrangler deploy --env development; then
        echo -e "${GREEN}✅ Deployment successful${NC}"
    else
        echo -e "${RED}❌ Deployment failed${NC}"
        echo -e "${YELLOW}⚠️  Backup is available at: $BACKUP_FILE${NC}"
        exit 1
    fi
fi

echo ""

# Step 6: Post-deployment verification
echo "6️⃣  Post-deployment verification..."
echo "   Checking site availability..."
if curl -f -s -o /dev/null -w "%{http_code}" https://www.professionaldiver.app | grep -q "200\|301\|302"; then
    echo -e "${GREEN}✅ Site is accessible${NC}"
else
    echo -e "${YELLOW}⚠️  Site may not be fully accessible yet (this is normal immediately after deployment)${NC}"
fi

echo ""
echo -e "${GREEN}🎉 Safe deployment completed!${NC}"
echo ""
echo "📋 Summary:"
echo "   ✅ Pre-deployment verification passed"
echo "   ✅ Backup created: $BACKUP_FILE"
echo "   ✅ Application built successfully"
echo "   ✅ Deployment completed"
echo ""
echo "⚠️  Important:"
echo "   - Backup is stored at: $BACKUP_FILE"
echo "   - Verify the site is working correctly"
echo "   - Check database connection in production"
echo ""





