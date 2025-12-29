# Port 3000 Management Guide

## Immediate Fix Commands

### 1. Kill Specific Processes (using PIDs from lsof)
```bash
kill -9 44602 51407
```

### 2. Automatic Port Cleanup (recommended for repeated use)
```bash
lsof -ti:3000 | xargs kill -9
```

### 3. Verify Port is Free
```bash
lsof -i :3000
# Should return empty if successful
```

## Preventative Solutions (Already Implemented)

### 1. Vite Config Change
- **File**: `vite.config.ts`
- **Change**: Port changed from 3000 to 3001
- **Benefit**: Avoids conflicts with other services

### 2. Package.json Script Update
- **File**: `package.json`
- **Change**: `dev:web` script now uses port 3001
- **Benefit**: Consistent port usage across all commands

## Alternative Command-Line Methods

### Start with Different Port
```bash
# Method 1: Using npm script
npm run dev:web -- --port 3002

# Method 2: Direct vite command
vite --host 127.0.0.1 --port 3002

# Method 3: Environment variable
PORT=3002 npm run dev:web
```

### Find and Kill Any Port
```bash
# Generic function for any port
kill_port() {
    lsof -ti:$1 | xargs kill -9
}

# Usage examples
kill_port 3000
kill_port 5000
kill_port 8080
```

## Current Server Configuration
- **Frontend**: Port 3001 (Vite + React 18.3.1)
- **Backend**: Port 5000 (Express + TypeScript)
- **Status**: Both servers verified and running ✅

## Troubleshooting Commands
```bash
# Check what's using a port
lsof -i :PORT_NUMBER

# Kill all node processes (use with caution)
pkill -f node

# Check all listening ports
netstat -tulpn | grep LISTEN
```
