#!/bin/bash
set -euo pipefail

echo "🚀 Safe Deployment Script for Media Fields"
echo "==========================================="
echo ""

# Check if DATABASE_URL is set
if [ -z "${DATABASE_URL:-}" ]; then
    echo "❌ DATABASE_URL environment variable is not set."
    echo ""
    echo "Please set it with:"
    echo "  export DATABASE_URL='your-postgresql-connection-string'"
    echo ""
    echo "Or if it's already in Cloudflare secrets, we can run the migration"
    echo "directly if you provide it now."
    echo ""
    read -p "Enter your DATABASE_URL (or press Enter to skip migration and deploy code only): " DB_URL
    
    if [ -z "$DB_URL" ]; then
        echo ""
        echo "⚠️  Skipping database migration."
        echo "⚠️  You'll need to run the migration manually before using the new features."
        echo ""
        SKIP_MIGRATION=true
    else
        export DATABASE_URL="$DB_URL"
        SKIP_MIGRATION=false
    fi
else
    echo "✅ DATABASE_URL is set"
    SKIP_MIGRATION=false
fi

# Step 1: Run database migration (if DATABASE_URL is available)
if [ "$SKIP_MIGRATION" = false ]; then
    echo ""
    echo "📊 Step 1: Running database migration..."
    echo "   This will add media fields (videos, documents, embeds, links, images, audio)"
    echo "   to the lessons table. Safe to run multiple times."
    echo ""
    
    if pnpm run db:migrate:media; then
        echo ""
        echo "✅ Database migration completed successfully!"
        echo ""
    else
        echo ""
        echo "❌ Database migration failed!"
        echo "   Please check the error above and fix it before deploying."
        exit 1
    fi
else
    echo ""
    echo "⏭️  Skipping database migration (DATABASE_URL not provided)"
    echo ""
fi

# Step 2: Build the application
echo "🔨 Step 2: Building application..."
echo ""
if pnpm run build:worker; then
    echo ""
    echo "✅ Build completed successfully!"
    echo ""
else
    echo ""
    echo "❌ Build failed!"
    exit 1
fi

# Step 3: Deploy to production
echo "🚀 Step 3: Deploying to production..."
echo ""
if pnpm run deploy:prod; then
    echo ""
    echo "🎉 Deployment completed successfully!"
    echo ""
    if [ "$SKIP_MIGRATION" = true ]; then
        echo "⚠️  IMPORTANT: Remember to run the database migration:"
        echo "   export DATABASE_URL='your-url'"
        echo "   pnpm run db:migrate:media"
        echo ""
    fi
    echo "✅ Your application is now live with the new media fields feature!"
    echo ""
else
    echo ""
    echo "❌ Deployment failed!"
    exit 1
fi


