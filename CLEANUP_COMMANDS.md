# History Cleanup Commands - Ready to Run

## ⚠️ Before You Start

**Question:** Are you the **only developer** on this repo?

- **YES** → Use "Solo Developer" commands below (safest, easiest)
- **NO** → Use "With Collaborators" commands (requires coordination)

---

## Solo Developer (Recommended Path)

### Step 1: Create Replacement File

```bash
# Create outside repo (in home directory)
cat > ~/replacements.txt << 'EOF'
***REDACTED***@==>***REDACTED_PASSWORD***
***REDACTED_HOST***==>***REDACTED_HOST***
postgresql://postgres:***REDACTED***@==>postgresql://postgres:***REDACTED_PASSWORD***@
EOF
```

### Step 2: Install git-filter-repo

```bash
brew install git-filter-repo
```

### Step 3: Backup Current State

```bash
cd "/Users/Jon/0 A VIBE CODER PROJECTS MACBOOK PRO/Professional-Diver-Training.App-Main"
git branch backup-before-cleanup
```

### Step 4: Clean History

```bash
# Remove .env.local from history AND scrub password strings
git filter-repo \
  --path .env.local --invert-paths \
  --replace-text ~/replacements.txt \
  --force
```

### Step 5: Verify Cleanup

```bash
# Should return nothing
git log --all --source --full-history -S "***REDACTED***" --oneline
git log --all --source --full-history -- .env.local --oneline
```

### Step 6: Force Push

```bash
git push --force --all
git push --force --tags
```

**Done!** History is clean.

---

## With Collaborators (Team Path)

### Step 1: Coordinate

1. **Tell team:**
   - "Stopping work temporarily for security cleanup"
   - "Commit and push all current work"
   - "Will notify when done - you'll need to re-clone"

2. **Wait for confirmation** that all work is pushed

### Step 2-4: Same as Solo Developer

Follow Steps 1-4 from "Solo Developer" section above.

### Step 5: Notify Team

**Send this message to collaborators:**

```
Security cleanup complete. Please re-clone the repository:

cd ..
rm -rf Professional-Diver-Training.App-Main
git clone https://github.com/lalabalavujon-a11y/Professional-Diver.app.git Professional-Diver-Training.App-Main
cd Professional-Diver-Training.App-Main
git checkout staging

Your old local repo won't work after this cleanup.
```

### Step 6: Force Push

```bash
git push --force --all
git push --force --tags
```

---

## Recovery (If Something Goes Wrong)

```bash
# Restore from backup
git checkout backup-before-cleanup
git branch -f staging backup-before-cleanup
git push --force origin staging
```

---

## After Cleanup: Verify Everything Works

```bash
# Check branches
git branch -a

# Check recent commits
git log --oneline -10

# Verify no secrets in history
git log --all --source --full-history -S "***REDACTED***" --oneline
# Should return nothing
```

---

## Pre-Commit Hook (Already Installed)

The pre-commit hook is already installed at `.git/hooks/pre-commit`.

It will:
- ✅ Block committing `.env` files
- ⚠️ Warn about potential secrets
- ✅ Prevent future accidents

---

**Ready to run?** Choose your path (solo vs team) and follow the steps above.
