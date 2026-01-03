# Security & Vulnerability Checking Scripts

This directory contains scripts to help you review and fix dependency vulnerabilities detected by GitHub.

## Scripts Overview

### 1. `find-dependencies.sh`
Locates all dependency files in your project.

**Usage:**
```bash
./scripts/find-dependencies.sh
```

**What it does:**
- Finds all `package.json` files
- Locates lock files (package-lock.json, yarn.lock, etc.)
- Identifies node_modules directories
- Detects build configuration files
- Shows package manager indicators

### 2. `check-vulnerabilities.sh` (Bash)
Comprehensive vulnerability checking script for Unix/Linux/macOS.

**Usage:**
```bash
# Basic check
./scripts/check-vulnerabilities.sh

# Auto-fix vulnerabilities
./scripts/check-vulnerabilities.sh --fix

# Check with specific severity level
./scripts/check-vulnerabilities.sh --level=high

# JSON output
./scripts/check-vulnerabilities.sh --json

# Check specific directory
./scripts/check-vulnerabilities.sh --dir=./client

# Show help
./scripts/check-vulnerabilities.sh --help
```

**Options:**
- `--fix` - Automatically fix vulnerabilities (safe updates only)
- `--level=LEVEL` - Set audit level (low|moderate|high|critical)
- `--json` - Output results in JSON format
- `--dir=DIRECTORY` - Specify directory to check
- `--help` - Show help message

### 3. `check-vulnerabilities.js` (Node.js)
Cross-platform vulnerability checking script (works on Windows, macOS, Linux).

**Usage:**
```bash
# Basic check
node scripts/check-vulnerabilities.js

# Auto-fix vulnerabilities
node scripts/check-vulnerabilities.js --fix

# Check with specific severity level
node scripts/check-vulnerabilities.js --level=high

# JSON output
node scripts/check-vulnerabilities.js --json

# Check specific directory
node scripts/check-vulnerabilities.js --dir=./client
```

**Options:** Same as bash version

## Quick Start

### Step 1: Find Your Dependencies
```bash
./scripts/find-dependencies.sh
```

### Step 2: Check for Vulnerabilities
```bash
# Using bash script (macOS/Linux)
./scripts/check-vulnerabilities.sh

# OR using Node.js script (cross-platform)
node scripts/check-vulnerabilities.js
```

### Step 3: Review Results
The script will show:
- Number of vulnerabilities found
- Severity levels (Critical, High, Medium, Low)
- Affected packages
- Recommended fixes

### Step 4: Fix Vulnerabilities
```bash
# Automatic fix (safe updates only)
./scripts/check-vulnerabilities.sh --fix

# OR
node scripts/check-vulnerabilities.js --fix
```

**Note:** Automatic fixes only apply safe updates. Some vulnerabilities may require manual intervention.

## Integration with package.json

Add these scripts to your `package.json`:

```json
{
  "scripts": {
    "audit": "npm audit",
    "audit:fix": "npm audit fix",
    "audit:check": "node scripts/check-vulnerabilities.js",
    "audit:fix-all": "node scripts/check-vulnerabilities.js --fix",
    "find:deps": "bash scripts/find-dependencies.sh"
  }
}
```

Then run:
```bash
npm run audit:check
npm run audit:fix-all
```

## GitHub Integration

### Dependabot Configuration
Dependabot is configured in `.github/dependabot.yml` to:
- Automatically create PRs for security updates (daily)
- Create PRs for version updates (weekly)
- Group updates to reduce PR noise
- Label PRs appropriately

### GitHub Actions
A workflow is set up in `.github/workflows/security-audit.yml` to:
- Run security audits weekly
- Run audits on dependency file changes
- Generate audit reports
- Upload reports as artifacts

## Manual Review Process

1. **View in GitHub:**
   - Go to repository → Security tab → Dependabot alerts
   - Review each vulnerability

2. **Check locally:**
   ```bash
   npm audit
   ```

3. **Fix individually:**
   ```bash
   npm install package-name@version
   ```

4. **Test after fixes:**
   ```bash
   npm test
   ```

## Best Practices

1. **Regular Checks:** Run vulnerability checks weekly
2. **Prioritize:** Fix Critical and High severity first
3. **Test:** Always test after updating dependencies
4. **Review:** Check changelogs before major version updates
5. **Automate:** Use Dependabot and GitHub Actions for continuous monitoring

## Troubleshooting

### Script not executable
```bash
chmod +x scripts/*.sh
```

### No package.json found
- Ensure you're in the correct directory
- Check if dependencies are in a subdirectory (use `--dir` option)
- Verify package.json exists in the repository

### Vulnerabilities not fixed
- Some require manual updates
- Check for breaking changes in package changelogs
- Review GitHub Security tab for detailed information

### Different package managers
The scripts auto-detect package managers. Supported:
- npm (package-lock.json)
- yarn (yarn.lock)
- pnpm (pnpm-lock.yaml)
- bun (bun.lockb)

## Additional Resources

- [GitHub Dependabot Docs](https://docs.github.com/en/code-security/dependabot)
- [npm audit documentation](https://docs.npmjs.com/cli/v8/commands/npm-audit)
- [OWASP Dependency Check](https://owasp.org/www-project-dependency-check/)
- See `DEPENDENCY_VULNERABILITY_GUIDE.md` in project root for detailed guide
