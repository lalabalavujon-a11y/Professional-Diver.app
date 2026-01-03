#!/bin/bash

# Script to locate dependency files in the project
# Usage: ./scripts/find-dependencies.sh

echo "🔍 Searching for dependency files..."
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Find package.json files
echo -e "${GREEN}📦 Package.json files:${NC}"
find . -name "package.json" -type f 2>/dev/null | while read file; do
    echo "  ✓ $file"
    if [ -f "$file" ]; then
        echo "    Location: $(dirname "$file")"
        echo "    Dependencies: $(grep -c '"dependencies"' "$file" 2>/dev/null || echo "0")"
    fi
done

echo ""

# Find lock files
echo -e "${GREEN}🔒 Lock files:${NC}"
find . \( -name "package-lock.json" -o -name "yarn.lock" -o -name "pnpm-lock.yaml" -o -name "bun.lockb" \) -type f 2>/dev/null | while read file; do
    echo "  ✓ $file"
    if [ -f "$file" ]; then
        echo "    Size: $(du -h "$file" | cut -f1)"
    fi
done

echo ""

# Find node_modules
echo -e "${GREEN}📚 Node modules directories:${NC}"
find . -name "node_modules" -type d 2>/dev/null | head -5 | while read dir; do
    echo "  ✓ $dir"
    if [ -d "$dir" ]; then
        echo "    Packages installed: $(find "$dir" -maxdepth 1 -type d | wc -l | tr -d ' ')"
    fi
done

echo ""

# Check for build config files
echo -e "${GREEN}⚙️  Build configuration files:${NC}"
find . \( -name "tsconfig.json" -o -name "vite.config.*" -o -name "next.config.*" -o -name "webpack.config.*" -o -name "rollup.config.*" \) -type f 2>/dev/null | while read file; do
    echo "  ✓ $file"
done

echo ""

# Check for package managers
echo -e "${GREEN}📋 Package manager indicators:${NC}"
[ -f "package-lock.json" ] && echo "  ✓ npm (package-lock.json found)"
[ -f "yarn.lock" ] && echo "  ✓ yarn (yarn.lock found)"
[ -f "pnpm-lock.yaml" ] && echo "  ✓ pnpm (pnpm-lock.yaml found)"
[ -f "bun.lockb" ] && echo "  ✓ bun (bun.lockb found)"

echo ""

# Summary
echo -e "${YELLOW}📊 Summary:${NC}"
PACKAGE_COUNT=$(find . -name "package.json" -type f 2>/dev/null | wc -l | tr -d ' ')
LOCK_COUNT=$(find . \( -name "package-lock.json" -o -name "yarn.lock" -o -name "pnpm-lock.yaml" \) -type f 2>/dev/null | wc -l | tr -d ' ')

echo "  Package.json files found: $PACKAGE_COUNT"
echo "  Lock files found: $LOCK_COUNT"

if [ "$PACKAGE_COUNT" -eq 0 ]; then
    echo ""
    echo -e "${YELLOW}⚠️  No package.json files found.${NC}"
    echo "  This might mean:"
    echo "    - Dependencies are managed elsewhere"
    echo "    - Files are in .gitignore"
    echo "    - Project structure is different"
    echo ""
    echo "  Checking for common project structures..."
    
    # Check for monorepo structures
    [ -d "packages" ] && echo "  ✓ Found 'packages' directory (possible monorepo)"
    [ -d "apps" ] && echo "  ✓ Found 'apps' directory (possible monorepo)"
    [ -d "client" ] && echo "  ✓ Found 'client' directory"
    [ -d "server" ] && echo "  ✓ Found 'server' directory"
fi

echo ""
echo "✅ Search complete!"

