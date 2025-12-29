#!/bin/bash

# Script to set up Cloudflare D1 database for Professional Diver Training Platform

set -e

echo "🚀 Setting up Cloudflare D1 Database"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

DB_NAME="professionaldiver-db"

# Check if D1 database already exists
echo "Checking for existing D1 databases..."
EXISTING_DB=$(wrangler d1 list 2>&1 | grep -i "$DB_NAME" || echo "")

if [ -n "$EXISTING_DB" ]; then
    echo -e "${YELLOW}⚠️  D1 database '$DB_NAME' already exists${NC}"
    echo ""
    echo "Existing databases:"
    wrangler d1 list
    echo ""
    read -p "Do you want to use the existing database? (Y/n): " use_existing
    if [[ $use_existing =~ ^[Nn]$ ]]; then
        echo "Please delete the existing database first or choose a different name."
        exit 1
    fi
    
    # Get database ID from existing database
    DB_INFO=$(wrangler d1 info "$DB_NAME" 2>&1)
    DB_ID=$(echo "$DB_INFO" | grep -i "database_id" | awk '{print $2}' || echo "")
    
    if [ -z "$DB_ID" ]; then
        echo -e "${RED}❌ Could not find database ID. Please check manually.${NC}"
        wrangler d1 info "$DB_NAME"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Using existing database: $DB_NAME${NC}"
    echo "   Database ID: $DB_ID"
else
    # Create new D1 database
    echo "Creating new D1 database: $DB_NAME"
    echo ""
    
    CREATE_OUTPUT=$(wrangler d1 create "$DB_NAME" 2>&1)
    
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Failed to create D1 database${NC}"
        echo "$CREATE_OUTPUT"
        exit 1
    fi
    
    echo "$CREATE_OUTPUT"
    echo ""
    
    # Extract database ID from output
    DB_ID=$(echo "$CREATE_OUTPUT" | grep -i "database_id" | sed -n 's/.*database_id = "\([^"]*\)".*/\1/p' | head -1)
    
    if [ -z "$DB_ID" ]; then
        # Try alternative extraction
        DB_ID=$(echo "$CREATE_OUTPUT" | grep -oP 'database_id["\s=]+["\s]*([a-f0-9-]+)' | grep -oP '[a-f0-9-]+' | head -1)
    fi
    
    if [ -z "$DB_ID" ]; then
        echo -e "${YELLOW}⚠️  Could not automatically extract database ID${NC}"
        echo "Please copy the database_id from the output above and run:"
        echo "  ./scripts/update-d1-config.sh <database-id>"
        exit 1
    fi
    
    echo -e "${GREEN}✅ D1 database created successfully!${NC}"
    echo "   Database ID: $DB_ID"
fi

# Update wrangler.toml
echo ""
echo "Updating wrangler.toml..."

# Check if D1 config already exists in wrangler.toml
if grep -q "\[\[env.production.d1_databases\]\]" wrangler.toml; then
    echo "D1 configuration already exists in wrangler.toml"
    read -p "Do you want to update it? (Y/n): " update_choice
    if [[ ! $update_choice =~ ^[Nn]$ ]]; then
        # Update existing database_id
        if [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS
            sed -i '' "s/database_id = \".*\"/database_id = \"$DB_ID\"/" wrangler.toml
        else
            # Linux
            sed -i "s/database_id = \".*\"/database_id = \"$DB_ID\"/" wrangler.toml
        fi
        echo -e "${GREEN}✅ Updated database_id in wrangler.toml${NC}"
    fi
else
    # Add D1 configuration
    cat >> wrangler.toml << EOF

# D1 Database binding for production
[[env.production.d1_databases]]
binding = "DB"
database_name = "$DB_NAME"
database_id = "$DB_ID"
EOF
    echo -e "${GREEN}✅ Added D1 configuration to wrangler.toml${NC}"
fi

# Update wrangler-api.toml
echo ""
echo "Updating wrangler-api.toml..."

if grep -q "\[\[env.production.d1_databases\]\]" wrangler-api.toml; then
    echo "D1 configuration already exists in wrangler-api.toml"
    read -p "Do you want to update it? (Y/n): " update_choice
    if [[ ! $update_choice =~ ^[Nn]$ ]]; then
        if [[ "$OSTYPE" == "darwin"* ]]; then
            sed -i '' "s/database_id = \".*\"/database_id = \"$DB_ID\"/" wrangler-api.toml
        else
            sed -i "s/database_id = \".*\"/database_id = \"$DB_ID\"/" wrangler-api.toml
        fi
        echo -e "${GREEN}✅ Updated database_id in wrangler-api.toml${NC}"
    fi
else
    # Update existing placeholder
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "s/database_id = \"your-d1-database-id\"/database_id = \"$DB_ID\"/" wrangler-api.toml
    else
        sed -i "s/database_id = \"your-d1-database-id\"/database_id = \"$DB_ID\"/" wrangler-api.toml
    fi
    echo -e "${GREEN}✅ Updated database_id in wrangler-api.toml${NC}"
fi

# Run migrations
echo ""
echo "Running database migrations..."
MIGRATION_FILE="./migrations/0000_tricky_ezekiel_stane.sql"

if [ -f "$MIGRATION_FILE" ]; then
    echo "Running migration: $MIGRATION_FILE"
    wrangler d1 execute "$DB_NAME" --file="$MIGRATION_FILE" --env production
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Migrations completed successfully${NC}"
    else
        echo -e "${YELLOW}⚠️  Migration may have failed. Check the output above.${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Migration file not found: $MIGRATION_FILE${NC}"
    echo "You may need to run migrations manually:"
    echo "  wrangler d1 execute $DB_NAME --file=./migrations/0000_tricky_ezekiel_stane.sql --env production"
fi

# Verify setup
echo ""
echo "Verifying D1 database setup..."
wrangler d1 info "$DB_NAME"

echo ""
echo -e "${GREEN}🎉 D1 Database setup complete!${NC}"
echo ""
echo "Next steps:"
echo "  1. Verify database: wrangler d1 info $DB_NAME"
echo "  2. Test connection: wrangler d1 execute $DB_NAME --command='SELECT 1' --env production"
echo "  3. Deploy: pnpm run deploy:prod"
echo ""
echo "Note: D1 uses SQLite, so you don't need DATABASE_URL anymore!"
echo "The code will automatically use D1 when available in Cloudflare Workers."





