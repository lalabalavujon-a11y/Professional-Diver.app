# Fix 503 API Error - Quick Guide

## Problem
Getting "503 Service Unavailable" when trying to sign in. This means the frontend can't reach the API server.

## Solution

### Option 1: Use the Correct Port (Quick Fix)

Your Vite dev server is running on **port 3001**, not 3000.

**Access your app at:**
- ✅ `http://localhost:3001/signin`
- ❌ NOT `http://localhost:3000/signin`

### Option 2: Restart Dev Servers (Recommended)

I've updated the config to use port 3000. Restart your servers:

```bash
# Stop any running servers
pnpm run dev:reset

# Or manually:
# Kill processes on ports 3000, 3001, and 5000
kill $(lsof -t -iTCP:3000 -sTCP:LISTEN) 2>/dev/null || true
kill $(lsof -t -iTCP:3001 -sTCP:LISTEN) 2>/dev/null || true
kill $(lsof -t -iTCP:5000 -sTCP:LISTEN) 2>/dev/null || true

# Start both servers
pnpm run dev:all
```

Then access: `http://localhost:3000/signin`

### Option 3: Check What's Running

```bash
# Check which ports are in use
lsof -ti:3000 && echo "Port 3000 in use" || echo "Port 3000 free"
lsof -ti:3001 && echo "Port 3001 in use" || echo "Port 3001 free"
lsof -ti:5000 && echo "Port 5000 in use" || echo "Port 5000 free"
```

### Verify API is Working

Test the API directly:

```bash
# Test API health
curl http://localhost:5000/health

# Test authentication endpoint
curl -X POST http://localhost:5000/api/auth/credentials \
  -H "Content-Type: application/json" \
  -d '{"email":"lalabalavu.jon@gmail.com","password":"admin123"}'
```

Should return:
```json
{"success":true,"user":{"id":"super-admin-1",...}}
```

## Current Status

✅ **API Server:** Running on port 5000  
✅ **Vite Dev Server:** Running on port 3001 (or 3000 after restart)  
✅ **Proxy:** Configured to forward `/api/*` to `http://127.0.0.1:5000`

## Quick Test

After restarting, test the proxy:

```bash
# Test through Vite proxy (should work)
curl http://localhost:3000/api/health
# or
curl http://localhost:3001/api/health
```

## Still Getting 503?

1. **Check browser console (F12)** - Look for network errors
2. **Check server logs** - See if API server is receiving requests
3. **Verify both servers are running:**
   ```bash
   ps aux | grep -E "(node|tsx|vite)" | grep -v grep
   ```
4. **Try accessing API directly:**
   - If `http://localhost:5000/api/auth/credentials` works but `http://localhost:3000/api/auth/credentials` doesn't, the proxy isn't working
   - Restart Vite dev server

## Your Credentials

- **Email:** `lalabalavu.jon@gmail.com`
- **Password:** `admin123`

Once you're on the correct port, sign-in should work!








