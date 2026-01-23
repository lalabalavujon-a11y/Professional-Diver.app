# macOS 12+ Local Upgrade Plan

## Goal
Upgrade a local Mac to macOS 12 (Monterey) or later with minimal downtime,
verified backups, and a clear rollback path.

## Phase 0 - Confirm target and compatibility
1. Identify current macOS version:
   - System Settings > General > About
   - Or in Terminal: `sw_vers`
2. Identify hardware model:
   - Apple menu > About This Mac
   - Or in Terminal: `system_profiler SPHardwareDataType`
3. Confirm Apple-supported versions for your model.
4. Choose the highest supported version (12 or newer) for long-term updates.

## Phase 1 - Preflight checks (risk reduction)
1. Backup:
   - Create a fresh Time Machine backup.
   - Optional: create a second backup to an external drive.
2. Free disk space:
   - Target at least 30-50 GB free.
3. Update current macOS to the latest point release.
4. Check disk health:
   - Disk Utility > First Aid on the system volume.
5. Verify critical apps and drivers:
   - Update VPN, security tools, and hardware drivers.
   - Remove or update incompatible kernel extensions if used.
6. Ensure power and network stability:
   - Plug in laptop power.
   - Use a reliable network connection.

## Phase 2 - Acquire the installer
Preferred:
1. System Settings > General > Software Update.
2. Select the desired macOS version and download.

Alternative (Terminal):
1. List available installers:
   - `softwareupdate --list-full-installers`
2. Fetch the chosen version (example placeholder):
   - `softwareupdate --fetch-full-installer --full-installer-version 12.x.y`

App Store fallback:
1. Search for "Install macOS Monterey" in the App Store.
2. Download to /Applications.

## Phase 3 - Execute the upgrade
1. Quit all applications.
2. Launch the installer:
   - /Applications/Install macOS Monterey.app
3. Accept the license, select the system disk, and begin.
4. Allow multiple restarts; do not interrupt power.

## Phase 4 - Post-upgrade validation
1. Confirm the new OS version:
   - `sw_vers`
2. Run Software Update to apply the latest patches.
3. Verify:
   - Wi-Fi, Bluetooth, and external devices
   - Critical apps and system services
4. Re-enable any temporarily disabled security settings.

## Rollback plan (if issues occur)
1. Boot into Recovery:
   - Apple silicon: hold power to "Options"
   - Intel: hold Command+R at startup
2. Restore from the Time Machine backup.

## Optional: Bootable USB installer
1. Format a USB drive (16 GB+) as "Mac OS Extended (Journaled)".
2. Create the installer (example):
   - `sudo "/Applications/Install macOS Monterey.app/Contents/Resources/createinstallmedia" --volume "/Volumes/MyUSB"`
3. Boot from USB:
   - Intel: hold Option at startup
   - Apple silicon: hold power to "Options"

## Notes for unsupported hardware
If the Mac is not officially supported for macOS 12+, the safest path is to
remain on the latest supported OS or upgrade hardware. Third-party patchers
exist, but they carry stability and security risks.
