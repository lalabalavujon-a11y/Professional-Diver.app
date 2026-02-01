# Database Password Rotation - Step by Step

## ⚠️ URGENT: Database Password Was Exposed

A database password was exposed in commit `152454e` on the `staging` branch.

**Action Required:** Rotate the password immediately.

---

## Step 1: Rotate Supabase Database Password

### A) Reset Password in Supabase

1. Go to: **Supabase Dashboard**
2. Select project: `uiafnaelixatqgwprsvc`
3. Navigate: **Settings → Database**
4. Click: **"Reset database password"**
5. **Save the new password securely** (use 1Password/Bitwarden)

### B) Update Connection String

The new connection string format:
```
DATABASE_URL=postgresql://postgres:NEW_PASSWORD@***REDACTED_HOST***:5432/postgres?sslmode=require
```

**Important:** URL-encode the password if it contains special characters.

---

## Step 2: Update All Services

### A) Railway (Current Service)

1. Go to Railway Dashboard
2. Select your current service
3. **Variables** tab
4. Find `DATABASE_URL`
5. Update with new password
6. Service will automatically restart

### B) Railway (Future Staging + Prod Services)

When you create staging/prod services:
- Copy `DATABASE_URL` with new password to both
- Use same password for both (or separate staging DB if preferred)

### C) Local Development

1. Update `.env.local`:
   ```bash
   DATABASE_URL=postgresql://postgres:NEW_PASSWORD@***REDACTED_HOST***:5432/postgres?sslmode=require
   ```

2. **Never commit this file** (it's in `.gitignore`)

---

## Step 3: Verify Connection

After updating, verify the connection works:

```bash
npm run db:verify-url
```

Or start your API and confirm it connects:
```bash
npm run dev:api
```

Check logs for successful database connection.

---

## Step 4: Remove from Git History (After Rotation)

**⚠️ Only do this AFTER password is rotated and all services updated.**

### Option A: Solo Developer (Recommended)

If you're the only person working on this repo:

```bash
# Install git-filter-repo if needed
brew install git-filter-repo

# Remove .env.local from all history
git filter-repo --path .env.local --invert-paths

# Force push (rewrites history)
git push --force --all
git push --force --tags
```

**Result:** `.env.local` completely removed from git history.

### Option B: With Collaborators

If others are working on this repo:

1. **Coordinate with team:**
   - Tell them to stop working temporarily
   - Wait for all work to be committed/pushed

2. **Run history rewrite:**
   ```bash
   brew install git-filter-repo
   git filter-repo --path .env.local --invert-paths
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
   ```

---

## Step 5: Verification Checklist

After completing all steps:

- [ ] Supabase password rotated
- [ ] Railway current service updated
- [ ] Local `.env.local` updated
- [ ] Connection verified (`npm run db:verify-url`)
- [ ] Git history cleaned (if solo developer)
- [ ] Team notified and re-cloned (if collaborators)

---

## Prevention

✅ `.env.local` is in `.gitignore`  
✅ `.env.example` template created  
✅ Secret management guide created  
✅ Safety notes added to `.env.example`

**Going forward:**
- Never commit `.env.local`
- Use `.env.example` as template
- Store secrets in Railway/Cloudflare, not git

---

## Timeline

**Immediate (do now):**
1. Rotate password (5 min)
2. Update Railway + local (5 min)
3. Verify connection (2 min)

**After rotation (when ready):**
4. Clean git history (5 min)
5. Notify team if needed (if collaborators)

**Total time:** ~20 minutes

---

**Status:** Password rotation required | Git history cleanup recommended after rotation
