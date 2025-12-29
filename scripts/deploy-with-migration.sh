#!/bin/bash
# Safe deployment script that applies database migration before deploying

set -e  # Exit on error

echo "🚀 Starting safe deployment process..."
echo ""

# Step 1: Backup (already in predeploy hook)
echo "📦 Step 1: Creating backup..."
npm run backup:export || echo "⚠️  Backup script not found, continuing..."

# Step 2: Apply database migration
echo ""
echo "🔄 Step 2: Applying database migration..."
if [ -z "$DATABASE_URL" ]; then
  echo "⚠️  DATABASE_URL not set. Skipping migration."
  echo "   Make sure to run: export DATABASE_URL='your-database-url'"
else
  echo "✅ DATABASE_URL is set"
  npm run db:migrate:media
  echo "✅ Migration applied successfully"
fi

# Step 3: Build the application
echo ""
echo "🔨 Step 3: Building application..."
npm run build:worker
echo "✅ Build completed"

# Step 4: Deploy to production
echo ""
echo "🚀 Step 4: Deploying to production..."
read -p "Deploy to production? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  wrangler deploy --env production
  echo "✅ Deployment completed!"
else
  echo "❌ Deployment cancelled"
  exit 1
fi

echo ""
echo "🎉 Deployment process completed successfully!"
echo ""
echo "📋 Next steps:"
echo "   1. Verify the site is working: https://diverwell.app"
echo "   2. Test the lesson editor to ensure media fields work"
echo "   3. Check that existing lessons still display correctly"




