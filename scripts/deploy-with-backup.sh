#!/bin/bash

# Automated deployment script with automatic backup/restore
# Usage: ./scripts/deploy-with-backup.sh [dev|prod]

set -e  # Exit on error

ENV=${1:-prod}
echo "🚀 Starting deployment to $ENV environment..."

# Step 1: Export backup before deployment
echo ""
echo "📦 Step 1: Exporting current tracks and lessons..."
npm run backup:export

if [ $? -ne 0 ]; then
  echo "❌ Backup export failed! Aborting deployment."
  exit 1
fi

echo "✅ Backup exported successfully"
echo ""

# Step 2: Deploy application
echo "🚀 Step 2: Deploying application..."
if [ "$ENV" = "dev" ]; then
  npm run deploy:dev
elif [ "$ENV" = "prod" ]; then
  npm run deploy:prod
else
  echo "❌ Invalid environment. Use 'dev' or 'prod'"
  exit 1
fi

if [ $? -ne 0 ]; then
  echo "❌ Deployment failed!"
  exit 1
fi

echo "✅ Deployment completed successfully"
echo ""

# Step 3: Prompt for restore
echo "⚠️  IMPORTANT: After deployment completes, run the following on your deployed environment:"
echo ""
echo "   npm run backup:restore"
echo ""
echo "This will restore all tracks and lessons to the new environment."
echo ""
read -p "Would you like to restore now? (y/N) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
  echo "🔄 Restoring tracks and lessons..."
  npm run backup:restore
  echo "✅ Restore completed!"
else
  echo "⏭️  Skipping restore. Remember to run 'npm run backup:restore' manually."
fi

echo ""
echo "🎉 Deployment process completed!"





