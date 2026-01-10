#!/bin/bash

echo "🔄 Restarting development server..."
echo ""

# Kill any existing server on port 5000
echo "Stopping existing server on port 5000..."
lsof -ti:5000 | xargs kill -9 2>/dev/null || echo "No server running on port 5000"

# Wait a moment
sleep 2

# Start the server
echo "Starting server..."
npm run dev:api





