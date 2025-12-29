#!/bin/bash
set -euo pipefail

echo "🔄 Database Migration Script"
echo "============================"
echo ""

# Check if DATABASE_URL is already set
if [ -z "${DATABASE_URL:-}" ]; then
    echo "⚠️  DATABASE_URL is not set."
    echo ""
    echo "Please provide your PostgreSQL connection string."
    echo "Format: postgresql://user:password@host/database?sslmode=require"
    echo ""
    echo "Example from Neon:"
    echo "  postgresql://username:password@ep-xxx.region.neon.tech/dbname?sslmode=require"
    echo ""
    read -sp "Enter DATABASE_URL (input will be hidden): " DB_URL
    echo ""
    echo ""
    
    if [ -z "$DB_URL" ]; then
        echo "❌ DATABASE_URL is required. Migration cancelled."
        exit 1
    fi
    
    export DATABASE_URL="$DB_URL"
    echo "✅ DATABASE_URL set (hidden for security)"
else
    echo "✅ DATABASE_URL is already set"
fi

echo ""
echo "🔄 Running migration..."
echo "   This will add media fields to the lessons table."
echo "   Safe to run multiple times - uses IF NOT EXISTS."
echo ""

# Run the migration
if pnpm run db:migrate:media; then
    echo ""
    echo "🎉 Migration completed successfully!"
    echo ""
    echo "✅ All media fields have been added to the lessons table:"
    echo "   - videos"
    echo "   - documents"
    echo "   - embeds"
    echo "   - links"
    echo "   - images"
    echo "   - audio"
    echo ""
    echo "Your database is now ready for the new media features!"
else
    echo ""
    echo "❌ Migration failed. Please check the error above."
    exit 1
fi


