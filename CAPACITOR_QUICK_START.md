# Capacitor Quick Start Guide

## ✅ Setup Complete!

Your app is now configured with Capacitor and ready for iOS and Android development. Both native platforms have been added successfully.

## 🚀 Quick Commands

### Development Workflow

```bash
# 1. Build your web app
pnpm run build

# 2. Sync to native projects
pnpm run cap:sync
# OR
npx cap sync

# 3. Open in native IDE
pnpm run cap:ios      # Opens Xcode (macOS only)
pnpm run cap:android  # Opens Android Studio
```

### Build for Production

```bash
# iOS
pnpm run cap:build:ios

# Android
pnpm run cap:build:android
```

## 📱 Testing Your App

### iOS (requires macOS + Xcode)

1. **Install Xcode** (if not already installed)
   - Download from Mac App Store (free, ~12GB)
   - Install Xcode Command Line Tools: `xcode-select --install`

2. **Open in Xcode**
   ```bash
   pnpm run cap:ios
   ```

3. **Run on Simulator**
   - In Xcode, select a simulator (iPhone 15, etc.)
   - Click the Play button or press `Cmd + R`

4. **Run on Physical Device**
   - Connect iPhone/iPad via USB
   - Select your device in Xcode
   - You'll need to sign the app (see below)

### Android

1. **Install Android Studio** (if not already installed)
   - Download from: https://developer.android.com/studio
   - Install Android SDK and tools

2. **Open in Android Studio**
   ```bash
   pnpm run cap:android
   ```

3. **Run on Emulator**
   - Create an Android Virtual Device (AVD) in Android Studio
   - Click Run button

4. **Run on Physical Device**
   - Enable Developer Options on your Android device
   - Enable USB Debugging
   - Connect via USB
   - Click Run in Android Studio

## 🔐 Code Signing (Required for App Store)

### iOS Code Signing

1. **Apple Developer Account** ($99/year)
   - Sign up: https://developer.apple.com/programs/
   - Wait for approval (1-3 days)

2. **In Xcode:**
   - Select your project in the navigator
   - Go to "Signing & Capabilities"
   - Select your Team (Apple Developer account)
   - Xcode will automatically manage certificates

3. **For App Store:**
   - Product → Archive
   - Distribute App → App Store Connect
   - Follow the upload wizard

### Android Code Signing

1. **Generate Keystore** (one-time)
   ```bash
   keytool -genkey -v -keystore diverwell-release-key.jks \
     -keyalg RSA -keysize 2048 -validity 10000 \
     -alias diverwell
   ```

2. **Update `android/app/build.gradle`:**
   ```gradle
   android {
     signingConfigs {
       release {
         storeFile file('../diverwell-release-key.jks')
         storePassword 'YOUR_PASSWORD'
         keyAlias 'diverwell'
         keyPassword 'YOUR_PASSWORD'
       }
     }
     buildTypes {
       release {
         signingConfig signingConfigs.release
       }
     }
   }
   ```

3. **Build Release APK/AAB:**
   ```bash
   cd android
   ./gradlew bundleRelease  # For AAB (recommended)
   # OR
   ./gradlew assembleRelease  # For APK
   ```

## 📦 Preparing for App Store Submission

### App Icons

1. **Create Icons** (use your logo)
   - iOS: 1024x1024px (no transparency)
   - Android: 512x512px (no transparency)

2. **Generate All Sizes:**
   - Use online tools: https://www.appicon.co/ or https://icon.kitchen/
   - Or use Capacitor assets tool (coming soon)

3. **Place Icons:**
   - iOS: `ios/App/App/Assets.xcassets/AppIcon.appiconset/`
   - Android: `android/app/src/main/res/` (mipmap folders)

### Splash Screens

1. **Create Splash Screen**
   - Recommended: 1242x2688px (iPhone 14 Pro Max size)
   - Use your brand colors/logo

2. **Generate Splash Screens:**
   - Use: https://www.appicon.co/ (has splash screen generator)
   - Or manually create for each size

### App Store Assets

#### Apple App Store:
- **Screenshots**: 
  - iPhone 6.7" (iPhone 14 Pro Max): 1290x2796px
  - iPhone 6.5" (iPhone 11 Pro Max): 1242x2688px
  - iPad Pro 12.9": 2048x2732px
- **App Preview Videos** (optional): 30 seconds max
- **Description**: Up to 4000 characters
- **Keywords**: Up to 100 characters
- **Privacy Policy URL**: Required
- **Support URL**: Required

#### Google Play Store:
- **Screenshots**: 
  - Phone: 1080x1920px (at least 2, up to 8)
  - Tablet: 1200x1920px (optional)
- **Feature Graphic**: 1024x500px (required)
- **Description**: Up to 4000 characters
- **Privacy Policy URL**: Required

## 🔧 Configuration Updates Needed

### 1. Update API Endpoints

Your app currently uses localhost for development. For production, update:

**In `capacitor.config.ts`:**
```typescript
server: {
  // Remove or comment out for production
  // url: 'http://localhost:3000',
  // cleartext: true
}
```

**In your React code**, ensure API calls use your production URL:
```typescript
const API_URL = import.meta.env.PROD 
  ? 'https://your-production-api.com' 
  : 'http://localhost:5000';
```

### 2. Handle Deep Links

If you want custom URL schemes (e.g., `diverwell://`), update:

**In `capacitor.config.ts`:**
```typescript
ios: {
  scheme: 'diverwell', // Custom URL scheme
}
```

### 3. Add Native Plugins (Optional)

```bash
# Push Notifications
pnpm add @capacitor/push-notifications

# Camera
pnpm add @capacitor/camera

# Filesystem
pnpm add @capacitor/filesystem

# Then sync
pnpm run cap:sync
```

## 📋 Pre-Submission Checklist

### iOS:
- [ ] App builds without errors in Xcode
- [ ] Tested on iOS simulator
- [ ] Tested on physical iOS device
- [ ] App icon set (1024x1024px)
- [ ] Splash screen configured
- [ ] Privacy policy URL added
- [ ] App signed with distribution certificate
- [ ] Version number incremented
- [ ] Build number incremented
- [ ] Screenshots prepared
- [ ] App description written
- [ ] Keywords selected

### Android:
- [ ] App builds without errors in Android Studio
- [ ] Tested on Android emulator
- [ ] Tested on physical Android device
- [ ] App icon set (512x512px)
- [ ] Splash screen configured
- [ ] Privacy policy URL added
- [ ] Release keystore created
- [ ] App signed with release key
- [ ] Version code incremented
- [ ] Version name updated
- [ ] Screenshots prepared
- [ ] Feature graphic created (1024x500px)
- [ ] App description written

## 🚨 Common Issues

### iOS:
- **"No signing certificate found"**
  - Solution: Add your Apple Developer account in Xcode → Preferences → Accounts

- **"App won't install on device"**
  - Solution: Trust your developer certificate on device: Settings → General → Device Management

- **"Build fails with Swift errors"**
  - Solution: Update CocoaPods: `cd ios/App && pod install`

### Android:
- **"Gradle sync failed"**
  - Solution: Update Android SDK in Android Studio → SDK Manager

- **"App crashes on launch"**
  - Solution: Check Logcat in Android Studio for error messages

- **"Build fails: minSdkVersion"**
  - Solution: Update `minSdkVersion` in `android/app/build.gradle` (minimum 22)

## 🎯 Next Steps

1. **Test on Devices**: Run the app on real iOS and Android devices
2. **Create Developer Accounts**: 
   - Apple: https://developer.apple.com/programs/ ($99/year)
   - Google: https://play.google.com/console/signup ($25 one-time)
3. **Prepare Assets**: Icons, screenshots, descriptions
4. **Build Release Versions**: Archive (iOS) and Bundle (Android)
5. **Submit to Stores**: Follow store-specific submission processes

## 📚 Resources

- **Capacitor Docs**: https://capacitorjs.com/docs
- **iOS App Store Guidelines**: https://developer.apple.com/app-store/review/guidelines/
- **Google Play Policies**: https://play.google.com/about/developer-content-policy/
- **App Icon Generator**: https://www.appicon.co/
- **Screenshot Tools**: Use device simulators or real devices

## 💡 Pro Tips

1. **Test Early**: Test on real devices as soon as possible
2. **Version Control**: Add `ios/` and `android/` to `.gitignore` if they're large, or commit them
3. **CI/CD**: Consider cloud build services if you don't have a Mac
4. **Beta Testing**: Use TestFlight (iOS) and Internal Testing (Android) before public release
5. **Analytics**: Add analytics to track app usage and crashes

---

**You're all set!** Your app is ready for native development. Start testing and preparing for store submission! 🚀






