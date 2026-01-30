# GitHub Rulesets Setup - Step-by-Step

## 🎯 What You're Seeing

You've created a **Ruleset** named "Main" but it's:
- ❌ **Disabled** (needs to be enabled)
- ⚠️ **Not targeting any resources** (needs to target `main` branch)

---

## 📝 Step 1: Enable the Ruleset

1. Find the **"Enforcement status"** dropdown
2. Change from **"Disabled"** to **"Active"**
3. This enables the ruleset

---

## 🎯 Step 2: Target the `main` Branch

The warning says "This ruleset does not target any resources."

**You need to add branch targeting:**

1. Look for a section called **"Target branches"** or **"Branch rules"** or **"Rules"**
2. Click **"+ Add"** or **"Add rule"** or similar button
3. Select **"Branches"** or **"Branch name pattern"**
4. Enter: `main`
5. Save/Add

**Alternative:** Look for a section that says "Which rules should be applied?" and add branch targeting there.

---

## ✅ Step 3: Configure the Rules

Once targeting is set, enable these rules (similar to branch protection):

### A) Require a pull request before merging
- ✅ Enable this rule
- Set required approvals: **1**
- ✅ Dismiss stale approvals
- ✅ Require conversation resolution

### B) Require status checks to pass
- ✅ Enable this rule
- Add status check: **"Ci/build"** (or "build")
- ✅ Require branches to be up to date

### C) Block force pushes
- ✅ Enable this rule

### D) Block deletions
- ✅ Enable this rule

---

## 🔍 If You Can't Find "Target Branches"

The Rulesets interface might be slightly different. Look for:

- **"Rules"** section → **"Branch rules"** → Add `main`
- **"Targets"** or **"Resources"** section
- **"Apply to"** dropdown → Select "Branches" → Enter `main`
- A button that says **"Add rule"** or **"Configure rules"**

---

## 💡 Alternative: Use Traditional Branch Protection

If Rulesets is confusing, you can use the traditional method:

1. Go to: **Settings → Branches** (not Rulesets)
2. Click **"Add branch protection rule"**
3. Follow the traditional branch protection setup

Both methods work - Rulesets is newer, traditional is more straightforward.

---

## ✅ After Configuration

Once you:
- ✅ Enable the ruleset (set to "Active")
- ✅ Target `main` branch
- ✅ Enable the protection rules

The warning should disappear and `main` will be protected.

---

**Status:** Ruleset created | Needs to be enabled and target `main` branch
