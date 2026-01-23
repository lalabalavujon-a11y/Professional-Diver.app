# macOS 12+ Local Upgrade Runbook (Monterey and above)

This runbook is designed for **upgrading a local Mac to macOS 12+** with minimal risk and maximum reproducibility. It covers **Intel and Apple Silicon** and includes **backup, compatibility, upgrade execution, and post-upgrade validation** steps.

> Scope: This is about upgrading macOS itself (Monterey 12.x or later). If you only need the project to build locally, you may not need a full OS upgrade—but Xcode and tooling requirements often force it.

## 0) Decide your target (12 vs 13/14)

- **Minimum target**: macOS **12 (Monterey)**.
- **Recommended target (if supported by your Mac)**: the newest macOS your hardware supports (often improves security and Xcode compatibility).
- **If you must stay on 12**: plan to upgrade to the **latest 12.x patch** after installing (e.g., 12.7.x).

## 1) Pre-flight: capture current state (before you change anything)

On the Mac you’re upgrading:

1. **Record macOS version**
   - UI:  → **About This Mac**
   - Terminal:
     - `sw_vers`
2. **Record hardware type**
   - UI: About This Mac → **Chip** (Apple Silicon) or **Processor** (Intel)
   - Terminal:
     - `uname -m` (typically `arm64` for Apple Silicon, `x86_64` for Intel)
3. **Disk space check**
   - UI: System Settings → General → Storage
   - Target: have **at least 35–45GB free** before starting (more is better).
4. **Confirm your admin access**
   - You will need an **admin account password**.
5. **Collect “must keep working” apps**
   - VPNs, antivirus, endpoint agents, developer tools, audio drivers, virtualization tools, etc.

## 2) Compatibility check (this is the gate)

1. **Confirm your Mac supports macOS 12+**
   - Use Apple’s compatibility list for the target OS.
2. **If your Mac does not support macOS 12+**
   - Do **not** proceed with this runbook.
   - Use a supported Mac, or run your dev stack via a remote machine/CI.

## 3) Backups (do this even if you “don’t need backups”)

You want **two independent recovery options**:

### A) Time Machine backup (recommended)
1. Connect an external drive.
2. System Settings → General → **Time Machine** → Add Backup Disk.
3. Run **Back Up Now**.
4. Verify the backup finished successfully.

### B) Bootable/full-disk clone (highly recommended)
Use a reputable disk cloning tool to make a **bootable clone** (Intel) or a **full-disk clone** (Apple Silicon). Verify it’s readable and contains your data.

### Also capture your secrets
- Ensure you can recover:
  - password manager vault access
  - SSH keys
  - 2FA recovery codes
  - any VPN / SSO access needed to re-enroll device tools

## 4) Reduce upgrade risk (common failure prevention)

1. **Install current OS updates first**
   - System Settings → General → **Software Update** → install all updates for your current OS.
2. **Update critical apps/drivers**
   - VPN clients, security agents, audio drivers, virtualization (Parallels/VMware), backup tools.
3. **Uninstall or disable legacy kernel extensions (kexts)**
   - Old VPN/security/audio kexts are a frequent cause of boot issues after upgrade.
4. **If FileVault is enabled**
   - Ensure you know your **login password** and have your **recovery key** stored safely.
5. **Power + network**
   - Plug into power.
   - Use stable internet (installer downloads are large).

## 5) Choose the upgrade method (recommended order)

### Method 1 (recommended): In-place upgrade via Software Update
1. System Settings → General → **Software Update**
2. Select the macOS upgrade (Monterey or later)
3. Download → Install → follow prompts

Use this when you can see the upgrade offer and want the simplest path.

### Method 2: Full installer download via Terminal (useful when UI doesn’t offer it)
From Terminal:

- `softwareupdate --list-full-installers`
- Then:
  - `sudo softwareupdate --fetch-full-installer --full-installer-version 12.7.2`

Notes:
- The version you can fetch depends on Apple’s availability and your current OS.
- The installer typically lands in `/Applications` as `Install macOS <Name>.app`.

### Method 3: Create a USB installer (best for repeatability / multiple Macs)
1. Get a USB drive (at least **16GB**; it will be erased).
2. Format it in Disk Utility as **Mac OS Extended (Journaled)** (or APFS is fine for some cases), with a simple name like `MyVolume`.
3. Run `createinstallmedia` (example for Monterey):

```bash
sudo "/Applications/Install macOS Monterey.app/Contents/Resources/createinstallmedia" --volume "/Volumes/MyVolume"
```

Then boot from the USB installer (Intel: hold **Option** at boot; Apple Silicon: hold **Power** until startup options).

## 6) Execute the upgrade (in-place)

1. Close all apps.
2. Start upgrade (Method 1 or 2).
3. Expect multiple reboots and 30–120 minutes depending on disk speed and download size.
4. Do not interrupt power.

If you see:
- **“Not enough space”**: free space and restart the installer.
- **Stuck at “Less than a minute remaining”**: it can still be working—wait at least 60 minutes before taking action.

## 7) Post-upgrade: immediately patch to the latest supported release

1. System Settings → General → **Software Update**
2. Install all updates until fully current.
3. Reboot after updates (even if not requested) to stabilize drivers/tooling.

## 8) Post-upgrade: developer toolchain validation (common for this repo)

### Xcode + Command Line Tools
1. Install/update Xcode via the App Store (or Apple Developer downloads).
2. Open Xcode once to finish setup.
3. Install/activate Command Line Tools:
   - `xcode-select --install`
4. Accept Xcode license:
   - `sudo xcodebuild -license accept`

### Homebrew (if you use it)
- Install Homebrew (Apple Silicon usually defaults to `/opt/homebrew`).
- Verify:
  - `brew --version`

### Node tooling sanity check (repo-local)
In your repo workspace (after the OS upgrade):
1. Ensure Node version matches project expectations (check `.nvmrc` or `package.json` engines if present).
2. Install dependencies:
   - `npm ci` (or `npm install` depending on repo conventions)
3. Run checks:
   - `npm run lint`
   - `npm test`
   - `npm run build`

## 9) Recovery paths if something goes wrong

### Safe Mode
- Intel: hold **Shift** during boot.
- Apple Silicon: hold **Power** → startup options → select disk → hold **Shift** → Continue in Safe Mode.

### macOS Recovery reinstall (keeps data in most cases)
- Intel: Command (⌘) + R during boot.
- Apple Silicon: hold **Power** until startup options → **Options**.

Choose “Reinstall macOS” for your target OS (or the closest supported).

### Restore from Time Machine
From Recovery, choose “Restore from Time Machine” if the system is unstable.

## 10) What “done” looks like

You’re finished when:
- The Mac reports **macOS 12+** in About This Mac.
- Software Update reports **no remaining updates**.
- Xcode launches and CLI tools install successfully.
- You can run the project’s normal `npm` workflows without toolchain errors.

## References (official)

- Apple Software Update / installers (macOS): `https://support.apple.com/`
- macOS Recovery overview: `https://support.apple.com/guide/mac-help/`
