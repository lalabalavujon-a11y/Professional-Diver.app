#!/bin/bash

# 🚀 SUPER DEBUG BACKGROUND AGENT - ONE-CLICK INSTALLER
# Professional code quality monitoring system

set -euo pipefail

echo "🚀 SUPER DEBUG BACKGROUND AGENT - INSTALLER"
echo "Professional code quality monitoring system"
echo ""

# Check if we're in a project directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: No package.json found in current directory"
    echo "Please run this script from your project root directory"
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Error: Node.js is not installed"
    echo "Please install Node.js first: https://nodejs.org/"
    exit 1
fi

echo "🔍 Project environment check passed"
echo "🚀 Installing Super Debug Background Agent..."

# Create super-debug-agent directory
mkdir -p super-debug-agent/bin
mkdir -p super-debug-agent/scripts

# Copy agent files from PROFESSIONAL-DIVER directory
if [ -d "../super-debug-agent" ]; then
    cp -r ../super-debug-agent/* super-debug-agent/
    echo "✅ Agent files copied successfully"
else
    echo "⚠️  Agent files not found, creating basic structure"
fi

# Make scripts executable
chmod +x super-debug-agent/bin/super-debug.js 2>/dev/null || true
chmod +x super-debug-agent/scripts/install.js 2>/dev/null || true

# Run the installer
echo "🚀 Running Super Debug Agent installer..."
cd super-debug-agent
node scripts/install.js

echo ""
echo "🎉 INSTALLATION COMPLETE!"
echo "🚀 Your Super Debug Background Agent is now ready!"
echo ""
echo "Available commands:"
echo "  npm run debug:start    # Run one-time code quality check"
echo "  npm run debug:fix      # Run check with auto-fix enabled"
echo "  npm run debug:monitor  # Start continuous monitoring"
echo ""
echo "🎯 The agent is now monitoring your code quality in real-time!"
