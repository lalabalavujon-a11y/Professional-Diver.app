# Immediate Actions - Do These Now

## ⚠️ URGENT: Database Password Rotation

**Status:** Password exposed in commit `152454e`  
**Action:** Rotate immediately (15 minutes)

### Step-by-Step

1. **Supabase Dashboard:**
   - Project: `uiafnaelixatqgwprsvc`
   - Settings → Database → Reset database password
   - Save new password securely

2. **Update Railway:**
   - Current service → Variables → `DATABASE_URL`
   - Update with new password

3. **Update Local:**
   - `.env.local` → Update `DATABASE_URL`
   - Never commit this file

4. **Verify:**
   ```bash
   npm run db:verify-url
   ```

**See `PASSWORD_ROTATION_STEPS.md` for detailed instructions.**

---

## 🔄 Git History Cleanup (After Password Rotation)

### Are you the only developer?

**If YES (solo developer):**

```bash
brew install git-filter-repo
git filter-repo --path .env.local --invert-paths
git push --force --all
git push --force --tags
```

**If NO (has collaborators):**

1. Coordinate with team (stop work temporarily)
2. Run history rewrite (commands above)
3. Team must re-clone:
   ```bash
   # Old repo won't work
   cd ..
   rm -rf Professional-Diver-Training.App-Main
   git clone https://github.com/lalabalavujon-a11y/Professional-Diver.app.git Professional-Diver-Training.App-Main
   ```

---

## 📋 Secret Migration Checklist

After password rotation, move secrets to platforms:

### Cloudflare Pages
- [ ] `VITE_API_URL`
- [ ] `VITE_WS_URL`
- [ ] `VITE_SUPABASE_URL`
- [ ] `VITE_SUPABASE_ANON_KEY`

### Railway (Current Service)
- [ ] `DATABASE_URL` (with new password)
- [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `OPENAI_API_KEY`
- [ ] `LANGSMITH_API_KEY` + `LANGSMITH_PROJECT`
- [ ] `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET`
- [ ] `SENDGRID_API_KEY`
- [ ] `OPENWEATHER_API_KEY`
- [ ] `STORMGLASS_API_KEY`
- [ ] `WHATSAPP_APP_SECRET` (if used)

### Railway (Future Staging + Prod Services)
- [ ] Copy all secrets to staging service
- [ ] Copy all secrets to prod service
- [ ] Use test keys for staging, live keys for prod

---

## 🎯 Final Setup Steps (After Security Fix)

1. **GitHub Branch Protection** (10 min)
   - Settings → Branches → Protect `main`
   - Require CI checks + PR reviews

2. **Railway Services** (20 min)
   - Create `professional-diver-api-staging` → `staging` branch
   - Create `professional-diver-api-prod` → `main` branch
   - Copy environment variables to both

---

## ⏱️ Timeline

**Now (15 min):**
- Rotate database password
- Update Railway + local
- Verify connection

**After rotation (5 min):**
- Clean git history (if solo)
- Or coordinate with team (if collaborators)

**Then (30 min):**
- Move secrets to platforms
- Set up branch protection
- Create Railway services

**Total: ~1 hour** to complete all security + setup

---

**Priority:** Password rotation is URGENT - do this first!
