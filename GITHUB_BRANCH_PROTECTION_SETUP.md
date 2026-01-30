# GitHub Branch Protection - Step-by-Step Setup

## 🎯 Goal

Protect the `main` branch so that:
- ✅ No direct pushes to `main` (must use PRs)
- ✅ CI must pass before merging
- ✅ No force pushes
- ✅ No accidental deletions

---

## 📍 Step 1: Navigate to Branch Protection Settings

1. Go to your GitHub repository:
   ```
   https://github.com/lalabalavujon-a11y/Professional-Diver.app
   ```

2. Click **"Settings"** (top menu, right side)

3. In the left sidebar, click **"Branches"**

4. You should see a section: **"Branch protection rules"**

5. Click **"Add branch protection rule"** button

---

## 📝 Step 2: Configure Branch Name Pattern

In the **"Branch name pattern"** field, type:

```
main
```

**Important:** This must match exactly - just `main` (not `main*` or `*/main`)

---

## ✅ Step 3: Enable Protection Rules

Scroll down and enable these settings (in order):

### A) Require a pull request before merging

- ✅ Check the box: **"Require a pull request before merging"**
- Under this section, enable:
  - ✅ **"Require approvals"** → Set number to **1**
  - ✅ **"Dismiss stale pull request approvals when new commits are pushed"**

### B) Require status checks to pass before merging

- ✅ Check the box: **"Require status checks to pass before merging"**
- You'll see a list of available status checks
- ✅ Check the box next to: **"CI / build"** (or "build" if that's what shows)
  - If you see multiple CI checks, select the one that matches your workflow job name
- ✅ Check the box: **"Require branches to be up to date before merging"**

### C) Require conversation resolution before merging

- ✅ Check the box: **"Require conversation resolution before merging"**

### D) Do not allow bypassing the above settings

- ✅ Check the box: **"Do not allow bypassing the above settings"**
  - This prevents even admins from bypassing protection

### E) Block force pushes

- ✅ Check the box: **"Block force pushes"**
  - This prevents `git push --force` to `main`

### F) Block deletions

- ✅ Check the box: **"Block deletions"**
  - This prevents accidental branch deletion

---

## 💾 Step 4: Save the Rule

Scroll to the bottom and click:

**"Create"** (green button)

---

## ✅ Step 5: Verify Protection is Active

After saving, you should see:

1. A new rule listed: **"main"**
2. The rule shows all the enabled protections
3. A green checkmark or "Protected" badge

---

## 🧪 Step 6: Test the Protection (Optional)

To verify it works:

1. Try to push directly to `main`:
   ```bash
   git checkout main
   echo "# Test" >> README.md
   git add README.md
   git commit -m "Test direct push"
   git push origin main
   ```

2. **Expected result:** Push should be **rejected** or **blocked**

3. Instead, create a PR:
   ```bash
   git checkout -b test-protection
   echo "# Test" >> README.md
   git add README.md
   git commit -m "Test PR"
   git push origin test-protection
   ```
   Then open a PR: `test-protection` → `main`

4. **Expected result:** PR can be created, but merge is blocked until CI passes

---

## 📋 What This Protects Against

✅ **Direct pushes to main** → Blocked (must use PRs)  
✅ **Merging broken code** → Blocked (CI must pass)  
✅ **Force pushes** → Blocked (prevents history rewrites)  
✅ **Branch deletion** → Blocked (prevents accidents)  
✅ **Bypassing rules** → Blocked (even admins must follow rules)

---

## 🔄 Your New Workflow

**Before (unsafe):**
```bash
git checkout main
git push origin main  # ❌ Now blocked
```

**After (safe):**
```bash
git checkout -b feature/my-feature
# Make changes
git push origin feature/my-feature
# Open PR: feature/my-feature → main
# CI runs automatically
# Merge only if CI passes ✅
```

---

## ⚠️ Important Notes

1. **You can still work on `main` locally** - protection only affects pushes to GitHub

2. **Emergency bypass** (if absolutely needed):
   - Go to Settings → Branches
   - Temporarily disable the rule
   - Make your change
   - Re-enable the rule

3. **CI check name:** If your CI check doesn't appear in the list:
   - Make sure CI has run at least once on a PR
   - The check name must match exactly (case-sensitive)
   - Common names: "CI / build", "build", "CI"

---

## 🎯 Next Step

After branch protection is set up:

→ **Railway Services Setup** (see `FINAL_STEPS_CHECKLIST.md`)

---

**Status:** Ready to configure | Follow steps above to enable protection
