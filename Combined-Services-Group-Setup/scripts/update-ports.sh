#!/bin/bash

# Combined Services Group - Port Update Script
# This script updates all port configurations from 3000/5000 to 3001/5001
# to avoid conflicts with Professional Diver Training App

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo "🔧 Updating port configurations..."
echo "📁 Project directory: $PROJECT_DIR"

# Update package.json
if [ -f "$PROJECT_DIR/package.json" ]; then
  echo "  ✓ Updating package.json..."
  sed -i '' 's/PORT=5000/PORT=5001/g' "$PROJECT_DIR/package.json"
  sed -i '' 's/--port 3000/--port 3001/g' "$PROJECT_DIR/package.json"
  echo "    → Updated dev:api to use PORT=5001"
  echo "    → Updated dev:web to use port 3001"
else
  echo "  ⚠️  package.json not found"
fi

# Update vite.config.ts
if [ -f "$PROJECT_DIR/vite.config.ts" ]; then
  echo "  ✓ Updating vite.config.ts..."
  sed -i '' 's/port: 3000/port: 3001/g' "$PROJECT_DIR/vite.config.ts"
  sed -i '' 's/http:\/\/127\.0\.0\.1:5000/http:\/\/127.0.0.1:5001/g' "$PROJECT_DIR/vite.config.ts"
  echo "    → Updated Vite server port to 3001"
  echo "    → Updated API proxy target to 5001"
else
  echo "  ⚠️  vite.config.ts not found"
fi

# Update server/index.ts
if [ -f "$PROJECT_DIR/server/index.ts" ]; then
  echo "  ✓ Updating server/index.ts..."
  sed -i '' 's/const PORT = process\.env\.PORT || 5000/const PORT = process.env.PORT || 5001/g' "$PROJECT_DIR/server/index.ts"
  sed -i '' 's/http:\/\/localhost:3000/http:\/\/localhost:3001/g' "$PROJECT_DIR/server/index.ts"
  echo "    → Updated default PORT to 5001"
  echo "    → Updated CORS origin to http://localhost:3001"
else
  echo "  ⚠️  server/index.ts not found"
fi

# Update .env.example if it exists
if [ -f "$PROJECT_DIR/.env.example" ]; then
  echo "  ✓ Updating .env.example..."
  sed -i '' 's/^PORT=5000/PORT=5001/g' "$PROJECT_DIR/.env.example"
  echo "    → Updated default PORT to 5001"
fi

# Update README.md
if [ -f "$PROJECT_DIR/README.md" ]; then
  echo "  ✓ Updating README.md..."
  sed -i '' 's/http:\/\/localhost:3000/http:\/\/localhost:3001/g' "$PROJECT_DIR/README.md"
  sed -i '' 's/http:\/\/localhost:5000/http:\/\/localhost:5001/g' "$PROJECT_DIR/README.md"
  echo "    → Updated documentation URLs"
fi

# Update SETUP_GUIDE.md
if [ -f "$PROJECT_DIR/SETUP_GUIDE.md" ]; then
  echo "  ✓ Updating SETUP_GUIDE.md..."
  sed -i '' 's/http:\/\/localhost:3000/http:\/\/localhost:3001/g' "$PROJECT_DIR/SETUP_GUIDE.md"
  sed -i '' 's/http:\/\/localhost:5000/http:\/\/localhost:5001/g' "$PROJECT_DIR/SETUP_GUIDE.md"
  sed -i '' 's/port 5000/port 5001/g' "$PROJECT_DIR/SETUP_GUIDE.md"
  sed -i '' 's/port 3000/port 3001/g' "$PROJECT_DIR/SETUP_GUIDE.md"
  sed -i '' 's/PORT=5000/PORT=5001/g' "$PROJECT_DIR/SETUP_GUIDE.md"
  echo "    → Updated setup guide documentation"
fi

echo ""
echo "✅ Port configuration update complete!"
echo ""
echo "Updated ports:"
echo "  Frontend: 3000 → 3001"
echo "  Backend:  5000 → 5001"
echo ""
echo "You can now run both projects simultaneously:"
echo "  • Professional Diver App:    http://localhost:3000 (API: 5000)"
echo "  • Combined Services Group:   http://localhost:3001 (API: 5001)"
echo ""
