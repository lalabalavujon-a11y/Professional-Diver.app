# Mobile App Setup Guide

## Overview

This project uses **Capacitor** to build native mobile apps (iOS and Android) from the existing web application. The web app is fully mobile-responsive and works great on mobile browsers. Capacitor wraps it as native apps for distribution via App Store and Google Play Store.

## Current Status

### ✅ Completed Setup

1. **Capacitor Dependencies Installed**
   - `@capacitor/core` - Core Capacitor functionality
   - `@capacitor/cli` - Capacitor command-line tools
   - `@capacitor/ios` - iOS platform support
   - `@capacitor/android` - Android platform support

2. **Capacitor Configuration**
   - Root-level `capacitor.config.ts` created
   - App ID: `com.diverwell.training`
   - App Name: "Professional Diver Training"
   - Web directory: `dist/client`

3. **Build Scripts Added**
   - `npm run cap:sync` - Sync web build to native projects
   - `npm run cap:copy` - Copy web assets to native projects
   - `npm run cap:open:ios` - Open iOS project in Xcode
   - `npm run cap:open:android` - Open Android project in Android Studio
   - `npm run cap:build` - Build web app and sync to native projects
   - `npm run mobile:build` - Alias for cap:build
   - `npm run mobile:ios` - Build, sync, and open iOS project
   - `npm run mobile:android` - Build, sync, and open Android project

4. **Android Platform** ✅ **Working**
   - Android project syncing successfully
   - Web assets copying correctly
   - Ready for Android Studio development

5. **iOS Platform** ✅ **Working**
   - iOS platform successfully initialized
   - Xcode project created (App.xcodeproj)
   - Uses Swift Package Manager (Capacitor 8)
   - Web assets copying correctly
   - Ready for Xcode development

## Development Workflow

### Building for Mobile

1. **Build the web app:**
   ```bash
   npm run build
   ```

2. **Sync to native projects:**
   ```bash
   npm run cap:sync
   ```
   This copies the built web assets from `dist/client` to both iOS and Android projects.

### Android Development

1. **Build and sync:**
   ```bash
   npm run mobile:android
   ```
   This will build the web app, sync to Android, and open Android Studio.

2. **In Android Studio:**
   - Wait for Gradle sync to complete
   - Connect Android device or start emulator
   - Click "Run" to build and deploy

### iOS Development

**After completing iOS setup (see above):**

1. **Build and sync:**
   ```bash
   npm run mobile:ios
   ```
   This will build the web app, sync to iOS, and open Xcode.

2. **In Xcode:**
   - Select a device or simulator
   - Click "Run" to build and deploy

## Native Features

The Capacitor configuration includes:

- **Splash Screen**: Configured with brand colors (#0066CC)
- **Keyboard Plugin**: Handles keyboard behavior and resizing
- **Android Mixed Content**: Allowed for development

## Production Builds

### Android APK/AAB

1. Build and sync:
   ```bash
   npm run cap:build
   ```

2. Open Android Studio:
   ```bash
   npm run cap:open:android
   ```

3. In Android Studio:
   - Build > Generate Signed Bundle / APK
   - Follow prompts to create signed build
   - Upload to Google Play Console

### iOS IPA

1. Build and sync:
   ```bash
   npm run cap:build
   ```

2. Open Xcode:
   ```bash
   npm run cap:open:ios
   ```

3. In Xcode:
   - Product > Archive
   - Upload to App Store Connect
   - Submit for review

## Notes

- The web app is already mobile-responsive, so it works great in both native wrappers
- All web code runs inside native containers - no separate mobile codebase needed
- The same React/TypeScript codebase powers web, iOS, and Android
- Native plugins can be added for device-specific features (camera, push notifications, etc.)

## Troubleshooting

### iOS Sync Fails

If you encounter iOS sync issues, try:
1. Ensure Xcode is installed (required for iOS development)
2. Run `npm run cap:sync` to verify sync status
3. If issues persist, try removing and re-adding the iOS platform:
   ```bash
   rm -rf ios
   npx cap add ios
   npm run cap:sync
   ```

### Build Errors

Ensure you've run `npm run build` before syncing to native projects.

## CI/CD for iOS Builds

### macOS Runner Requirements

<!-- TODO: Completed - macOS 12+ upgrade for iOS CI/CD builds -->

For automated iOS builds in GitHub Actions, we use **macOS 12 (Monterey) or above**:

| macOS Version | Codename | Supported Xcode Versions |
|---------------|----------|--------------------------|
| macOS 12 | Monterey | Xcode 13.1 - 14.2 |
| macOS 13 | Ventura | Xcode 14.1 - 15.2 |
| macOS 14 | Sonoma | Xcode 15.0+ |

**Why macOS 12+?**
- GitHub deprecated `macos-11` runners in January 2024
- iOS 15.0 deployment target requires Xcode 13+ (available on macOS 11+)
- Modern Capacitor 8 requires Swift 5.9+ toolchain
- Better performance and newer iOS Simulator support

### GitHub Actions Workflow

The iOS build workflow is located at `.github/workflows/ios-build.yml` and includes:

1. **Automatic triggers** on changes to:
   - `ios/` directory
   - `client/` directory (web app changes)
   - `capacitor.config.ts`
   - `package.json`

2. **Build steps**:
   - Setup Node.js and Xcode
   - Install npm dependencies
   - Build web application
   - Sync Capacitor to iOS
   - Build iOS app (Debug or Release)
   - Upload build artifacts

3. **Manual triggers** via `workflow_dispatch`:
   ```bash
   # Using GitHub CLI
   gh workflow run ios-build.yml -f build_type=release
   ```

### Local Development Requirements

For local iOS development on macOS:

| Requirement | Minimum Version | Recommended |
|-------------|-----------------|-------------|
| macOS | 12.0 (Monterey) | 14.0 (Sonoma) |
| Xcode | 14.0 | 15.2+ |
| Node.js | 18.x | 20.x |
| iOS Deployment Target | 15.0 | 15.0 |

**Setup steps:**
1. Install Xcode from the App Store
2. Accept Xcode license: `sudo xcodebuild -license accept`
3. Install Command Line Tools: `xcode-select --install`
4. Install iOS Simulators via Xcode > Settings > Platforms

