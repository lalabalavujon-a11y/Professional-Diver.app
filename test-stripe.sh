#!/bin/bash

# Stripe Connection Test Script
# Tests Stripe API connection after server restart

echo "🧪 Testing Stripe Connection..."
echo ""

# Test Stripe connection endpoint
echo "📡 Calling /api/stripe/test..."
RESPONSE=$(curl -s -X GET http://127.0.0.1:5000/api/stripe/test)

echo "Response:"
echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"
echo ""

# Check if successful
if echo "$RESPONSE" | grep -q '"success":true'; then
    echo "✅ Stripe connection successful!"
    exit 0
else
    echo "❌ Stripe connection failed or not configured"
    echo ""
    echo "💡 Make sure:"
    echo "   1. STRIPE_SECRET_KEY is set in your environment"
    echo "   2. Server is running (pnpm run dev:api)"
    echo "   3. Server has been restarted after adding the test endpoint"
    exit 1
fi





