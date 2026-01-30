# Git History Cleanup Guide - Remove Exposed Secrets

## ⚠️ Why This Matters

Even if you rotated the password, **it still exists in git history**. Security scanners will keep flagging it until history is cleaned.

**This cleanup removes:**
1. The `.env.local` file from all history
2. The exposed password string from all commits
3. Any database connection strings with passwords

---

## Step 1: Verify Current State

### Check for Remaining Instances

```bash
# Search tracked files
git grep -n "***REDACTED***" || echo "✅ No instances in tracked files"
git grep -n "postgresql://postgres:" || echo "✅ No DB URLs in tracked files"

# Search all history (will show old commits)
git log --all --source --full-history -S "***REDACTED***" --oneline
```

**If anything appears:** It needs to be removed from history.

---

## Step 2: Create Replacement File

Create `replacements.txt` **outside the repo** (in your home directory or temp folder):

```bash
# Create replacement file
cat > ~/replacements.txt << 'EOF'
***REDACTED***@==>***REDACTED_PASSWORD***
***REDACTED_HOST***==>***REDACTED_HOST***
postgresql://postgres:***REDACTED***@==>postgresql://postgres:***REDACTED_PASSWORD***@
EOF
```

**Why outside repo:** So it doesn't get committed accidentally.

---

## Step 3: Install git-filter-repo

```bash
brew install git-filter-repo
```

If `brew` isn't available, use:
```bash
pip3 install git-filter-repo
```

---

## Step 4: Clean History

### Option A: Solo Developer (Recommended)

**If you're the only person working on this repo:**

```bash
# From repo root
cd /Users/Jon/0\ A\ VIBE\ CODER\ PROJECTS\ MACBOOK\ PRO/Professional-Diver-Training.App-Main

# Backup current state (safety net)
git branch backup-before-cleanup

# Remove .env.local from history AND scrub password strings
git filter-repo \
  --path .env.local --invert-paths \
  --replace-text ~/replacements.txt \
  --force

# Verify cleanup
git log --all --source --full-history -S "***REDACTED***" --oneline
# Should return nothing

# Force push (rewrites history)
git push --force --all
git push --force --tags
```

**Result:** `.env.local` and password strings completely removed from history.

### Option B: With Collaborators

**If others are working on this repo:**

1. **Coordinate with team:**
   - Tell them to commit and push all work
   - Tell them to stop working temporarily
   - Set a time window for the cleanup

2. **Run cleanup:**
   ```bash
   git branch backup-before-cleanup
   git filter-repo \
     --path .env.local --invert-paths \
     --replace-text ~/replacements.txt \
     --force
   git push --force --all
   git push --force --tags
   ```

3. **Team must re-clone:**
   ```bash
   # Old repo won't work - must re-clone
   cd ..
   rm -rf Professional-Diver-Training.App-Main
   git clone https://github.com/lalabalavujon-a11y/Professional-Diver.app.git Professional-Diver-Training.App-Main
   cd Professional-Diver-Training.App-Main
   git checkout staging
   ```

---

## Step 5: Verify Cleanup

After cleanup, verify nothing remains:

```bash
# Should return nothing
git log --all --source --full-history -S "***REDACTED***" --oneline
git log --all --source --full-history -S "db.uiafnaelixatqgwprsvc" --oneline

# Check .env.local is gone
git log --all --full-history -- .env.local
# Should return nothing
```

---

## Step 6: Clean Up Backup Branch (After Verification)

Once you've verified everything works:

```bash
# Delete backup branch (optional - keep for a few days first)
git branch -D backup-before-cleanup
```

---

## Prevention: Pre-Commit Hook

Add a pre-commit hook to prevent future secrets:

```bash
# Create pre-commit hook
cat > .git/hooks/pre-commit << 'HOOKEOF'
#!/bin/bash
# Prevent committing .env files
if git diff --cached --name-only | grep -E '\.env$|\.env\.local$|\.env\..*\.local$'; then
  echo "❌ ERROR: Attempted to commit .env file"
  echo "   .env files should never be committed"
  echo "   Use .env.example as a template instead"
  exit 1
fi

# Warn about potential secrets
if git diff --cached | grep -iE 'password|secret|api[_-]?key|token' | grep -vE 'example|template|placeholder|redacted'; then
  echo "⚠️  WARNING: Potential secret detected in staged changes"
  echo "   Review carefully before committing"
  read -p "Continue anyway? (y/N) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
fi
HOOKEOF

chmod +x .git/hooks/pre-commit
```

---

## Recovery (If Something Goes Wrong)

If the cleanup causes issues:

```bash
# Restore from backup
git checkout backup-before-cleanup
git branch -f staging backup-before-cleanup
git push --force origin staging
```

---

## Timeline

**Before cleanup:**
- [ ] Coordinate with team (if collaborators)
- [ ] Create backup branch
- [ ] Create replacements.txt

**Cleanup (5-10 min):**
- [ ] Install git-filter-repo
- [ ] Run filter-repo command
- [ ] Verify cleanup
- [ ] Force push

**After cleanup:**
- [ ] Team re-clones (if collaborators)
- [ ] Verify everything works
- [ ] Set up pre-commit hook

---

**Status:** Ready to clean history | Password rotation required first
