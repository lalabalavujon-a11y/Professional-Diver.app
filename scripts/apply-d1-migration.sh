#!/bin/bash
# Apply D1 migration for media fields

set -e

echo "🔄 Applying D1 migration for lesson media fields..."
echo ""

DB_NAME="professionaldiver-db"

# Check if columns exist first (D1 doesn't support IF NOT EXISTS)
echo "📋 Adding media columns to lessons table..."
echo ""

# Add each column (will error if exists, which is safe)
# Using --remote flag to execute on production database
wrangler d1 execute $DB_NAME \
  --command="ALTER TABLE lessons ADD COLUMN videos TEXT DEFAULT '[]';" \
  --remote --env production 2>&1 | grep -v "duplicate column name" || echo "✅ videos column (already exists or added)"

wrangler d1 execute $DB_NAME \
  --command="ALTER TABLE lessons ADD COLUMN documents TEXT DEFAULT '[]';" \
  --remote --env production 2>&1 | grep -v "duplicate column name" || echo "✅ documents column (already exists or added)"

wrangler d1 execute $DB_NAME \
  --command="ALTER TABLE lessons ADD COLUMN embeds TEXT DEFAULT '[]';" \
  --remote --env production 2>&1 | grep -v "duplicate column name" || echo "✅ embeds column (already exists or added)"

wrangler d1 execute $DB_NAME \
  --command="ALTER TABLE lessons ADD COLUMN links TEXT DEFAULT '[]';" \
  --remote --env production 2>&1 | grep -v "duplicate column name" || echo "✅ links column (already exists or added)"

wrangler d1 execute $DB_NAME \
  --command="ALTER TABLE lessons ADD COLUMN images TEXT DEFAULT '[]';" \
  --remote --env production 2>&1 | grep -v "duplicate column name" || echo "✅ images column (already exists or added)"

wrangler d1 execute $DB_NAME \
  --command="ALTER TABLE lessons ADD COLUMN audio TEXT DEFAULT '[]';" \
  --remote --env production 2>&1 | grep -v "duplicate column name" || echo "✅ audio column (already exists or added)"

echo ""
echo "🎉 Migration completed!"
echo ""
echo "📋 Verifying columns..."
wrangler d1 execute $DB_NAME \
  --command="PRAGMA table_info(lessons);" \
  --remote --env production

