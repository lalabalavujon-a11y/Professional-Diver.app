#!/bin/bash

# Automated Vulnerability Checking Script
# This script checks for dependency vulnerabilities and provides actionable reports
# Usage: ./scripts/check-vulnerabilities.sh [options]

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default options
AUTO_FIX=false
AUDIT_LEVEL="moderate"
OUTPUT_FORMAT="text"
DIRECTORY="."

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --fix)
            AUTO_FIX=true
            shift
            ;;
        --level=*)
            AUDIT_LEVEL="${1#*=}"
            shift
            ;;
        --json)
            OUTPUT_FORMAT="json"
            shift
            ;;
        --dir=*)
            DIRECTORY="${1#*=}"
            shift
            ;;
        --help)
            echo "Usage: $0 [options]"
            echo ""
            echo "Options:"
            echo "  --fix              Automatically fix vulnerabilities (safe updates only)"
            echo "  --level=LEVEL      Set audit level (low|moderate|high|critical)"
            echo "  --json             Output results in JSON format"
            echo "  --dir=DIRECTORY    Specify directory to check (default: current)"
            echo "  --help             Show this help message"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# Function to check if package.json exists
check_package_json() {
    local dir=$1
    if [ ! -f "$dir/package.json" ]; then
        return 1
    fi
    return 0
}

# Function to detect package manager
detect_package_manager() {
    local dir=$1
    if [ -f "$dir/package-lock.json" ]; then
        echo "npm"
    elif [ -f "$dir/yarn.lock" ]; then
        echo "yarn"
    elif [ -f "$dir/pnpm-lock.yaml" ]; then
        echo "pnpm"
    elif [ -f "$dir/bun.lockb" ]; then
        echo "bun"
    else
        echo "npm" # Default
    fi
}

# Function to run audit
run_audit() {
    local dir=$1
    local pm=$2
    
    echo -e "${BLUE}📦 Checking: $dir${NC}"
    echo -e "${BLUE}📋 Package Manager: $pm${NC}"
    echo ""
    
    cd "$dir" || exit 1
    
    case $pm in
        npm)
            if [ "$OUTPUT_FORMAT" = "json" ]; then
                npm audit --audit-level="$AUDIT_LEVEL" --json > audit-report.json 2>&1 || true
                cat audit-report.json
            else
                echo -e "${YELLOW}Running npm audit...${NC}"
                npm audit --audit-level="$AUDIT_LEVEL" || true
            fi
            ;;
        yarn)
            if [ "$OUTPUT_FORMAT" = "json" ]; then
                yarn audit --level "$AUDIT_LEVEL" --json > audit-report.json 2>&1 || true
                cat audit-report.json
            else
                echo -e "${YELLOW}Running yarn audit...${NC}"
                yarn audit --level "$AUDIT_LEVEL" || true
            fi
            ;;
        pnpm)
            if [ "$OUTPUT_FORMAT" = "json" ]; then
                pnpm audit --audit-level="$AUDIT_LEVEL" --json > audit-report.json 2>&1 || true
                cat audit-report.json
            else
                echo -e "${YELLOW}Running pnpm audit...${NC}"
                pnpm audit --audit-level="$AUDIT_LEVEL" || true
            fi
            ;;
        bun)
            echo -e "${YELLOW}Bun audit not yet supported${NC}"
            ;;
    esac
    
    cd - > /dev/null || exit 1
    echo ""
}

# Function to fix vulnerabilities
fix_vulnerabilities() {
    local dir=$1
    local pm=$2
    
    echo -e "${GREEN}🔧 Attempting to fix vulnerabilities in $dir...${NC}"
    cd "$dir" || exit 1
    
    case $pm in
        npm)
            echo -e "${YELLOW}Running npm audit fix...${NC}"
            npm audit fix || echo -e "${RED}Some vulnerabilities could not be fixed automatically${NC}"
            ;;
        yarn)
            echo -e "${YELLOW}Running yarn upgrade...${NC}"
            yarn upgrade --latest || echo -e "${RED}Some vulnerabilities could not be fixed automatically${NC}"
            ;;
        pnpm)
            echo -e "${YELLOW}Running pnpm update...${NC}"
            pnpm update --latest || echo -e "${RED}Some vulnerabilities could not be fixed automatically${NC}"
            ;;
    esac
    
    cd - > /dev/null || exit 1
    echo ""
}

# Main execution
echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     Dependency Vulnerability Checker                  ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check root directory
if check_package_json "$DIRECTORY"; then
    PM=$(detect_package_manager "$DIRECTORY")
    run_audit "$DIRECTORY" "$PM"
    
    if [ "$AUTO_FIX" = true ]; then
        fix_vulnerabilities "$DIRECTORY" "$PM"
        echo -e "${GREEN}✅ Re-running audit after fixes...${NC}"
        echo ""
        run_audit "$DIRECTORY" "$PM"
    fi
else
    echo -e "${YELLOW}⚠️  No package.json found in $DIRECTORY${NC}"
    echo -e "${YELLOW}Checking subdirectories...${NC}"
    echo ""
    
    # Check common subdirectories
    for subdir in client server packages apps; do
        if [ -d "$DIRECTORY/$subdir" ] && check_package_json "$DIRECTORY/$subdir"; then
            PM=$(detect_package_manager "$DIRECTORY/$subdir")
            run_audit "$DIRECTORY/$subdir" "$PM"
            
            if [ "$AUTO_FIX" = true ]; then
                fix_vulnerabilities "$DIRECTORY/$subdir" "$PM"
                echo -e "${GREEN}✅ Re-running audit after fixes...${NC}"
                echo ""
                run_audit "$DIRECTORY/$subdir" "$PM"
            fi
        fi
    done
fi

echo -e "${GREEN}✅ Vulnerability check complete!${NC}"
echo ""
echo -e "${BLUE}💡 Tips:${NC}"
echo "  - Review the output above for vulnerabilities"
echo "  - Use 'npm audit fix' to automatically fix safe updates"
echo "  - Check GitHub Security tab for detailed vulnerability information"
echo "  - Review Dependabot PRs for security updates"

