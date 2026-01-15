# B-ORTIM Mobilapp Guide

Komplett guide för att bygga och publicera B-ORTIM på iOS App Store och Google Play Store.

## Innehåll

1. [Förutsättningar](#förutsättningar)
2. [Projektstruktur](#projektstruktur)
3. [App-ikoner och Splash Screen](#app-ikoner-och-splash-screen)
4. [Bygga appen](#bygga-appen)
5. [iOS App Store](#ios-app-store)
6. [Google Play Store](#google-play-store)
7. [Push-notifikationer](#push-notifikationer)
8. [Felsökning](#felsökning)

---

## Förutsättningar

### För iOS

- **macOS** (krävs för iOS-byggen)
- **Xcode 15+** (från App Store)
- **Apple Developer Account** ($99/år) - [developer.apple.com](https://developer.apple.com)
- **CocoaPods**: `sudo gem install cocoapods`

### För Android

- **Android Studio** - [developer.android.com/studio](https://developer.android.com/studio)
- **Java JDK 17+**
- **Google Play Developer Account** ($25 engångsavgift) - [play.google.com/console](https://play.google.com/console)

### Miljövariabler

```bash
# Android
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/tools:$ANDROID_HOME/platform-tools

# iOS (automatiskt via Xcode)
```

---

## Projektstruktur

```
apps/web/
├── capacitor.config.ts      # Capacitor-konfiguration
├── resources/               # App-ikoner och splash screens
│   ├── icon.png            # 1024x1024 app-ikon
│   ├── splash.png          # 2732x2732 splash screen
│   └── icon-foreground.png # Android adaptive icon
├── ios/                     # iOS-projekt (genereras)
│   └── App/
│       ├── App.xcworkspace
│       └── App/Assets.xcassets
└── android/                 # Android-projekt (genereras)
    └── app/
        ├── build.gradle
        └── src/main/res/
```

---

## App-ikoner och Splash Screen

### Skapa källfiler

Skapa följande bilder i `apps/web/resources/`:

| Fil | Storlek | Beskrivning |
|-----|---------|-------------|
| `icon.png` | 1024x1024 | Huvud-appikon (kvadratisk, inga rundade hörn) |
| `icon-foreground.png` | 1024x1024 | Android adaptive icon (innehåll centrerat) |
| `splash.png` | 2732x2732 | Splash screen (logga centrerad) |

### Generera alla storlekar

```bash
# Installera cordova-res (genererar alla storlekar)
npm install -g cordova-res

# Generera ikoner och splash screens
cd apps/web
cordova-res --skip-config --copy

# Eller använd capacitor-assets
npm install -g @capacitor/assets
npx capacitor-assets generate
```

### Manuella specifikationer

**iOS App Icons:**
- 20x20, 29x29, 40x40, 58x58, 60x60, 76x76, 80x80, 87x87
- 120x120, 152x152, 167x167, 180x180, 1024x1024

**Android App Icons:**
- mdpi: 48x48
- hdpi: 72x72
- xhdpi: 96x96
- xxhdpi: 144x144
- xxxhdpi: 192x192

---

## Bygga appen

### Snabbstart

```bash
# Bygg för iOS (kräver macOS)
./scripts/build-mobile.sh ios release

# Bygg för Android
./scripts/build-mobile.sh android release

# Bygg för båda
./scripts/build-mobile.sh both release
```

### Steg-för-steg

```bash
cd apps/web

# 1. Bygg web-appen
npm run build

# 2. Lägg till plattformar (första gången)
npx cap add ios
npx cap add android

# 3. Synka till native-projekt
npx cap sync

# 4. Öppna i IDE
npx cap open ios      # Öppnar Xcode
npx cap open android  # Öppnar Android Studio
```

---

## iOS App Store

### 1. Förbered i Apple Developer Portal

1. Logga in på [developer.apple.com](https://developer.apple.com)
2. Gå till **Certificates, Identifiers & Profiles**
3. Skapa **App ID**:
   - Identifier: `com.bortim.app`
   - Capabilities: Push Notifications ✓

4. Skapa **Provisioning Profile**:
   - Type: App Store
   - App ID: com.bortim.app
   - Ladda ner och dubbelklicka för att installera

### 2. Konfigurera Xcode

```bash
# Öppna projektet
cd apps/web
npx cap open ios
```

I Xcode:
1. Välj **App** i Project Navigator
2. Under **Signing & Capabilities**:
   - Team: Välj ditt team
   - Bundle Identifier: `com.bortim.app`
   - Signing Certificate: Distribution
3. Under **General**:
   - Version: 1.0.0
   - Build: 1

### 3. Konfigurera Push Notifications

1. I Apple Developer Portal:
   - Skapa **APNs Key** (Authentication Key)
   - Ladda ner .p8-filen
   - Notera Key ID och Team ID

2. I din server (.env):
   ```
   APNS_KEY_ID=ABC123
   APNS_TEAM_ID=XYZ789
   APNS_KEY_PATH=/path/to/AuthKey.p8
   ```

### 4. Bygg och arkivera

I Xcode:
1. **Product → Clean Build Folder**
2. **Product → Archive**
3. När arkivet är klart öppnas Organizer

### 5. Ladda upp till App Store Connect

1. I Organizer: **Distribute App**
2. Välj **App Store Connect**
3. Följ wizard:
   - Upload
   - Next (signing)
   - Upload

### 6. App Store Connect

1. Gå till [appstoreconnect.apple.com](https://appstoreconnect.apple.com)
2. Skapa ny app eller välj befintlig
3. Fyll i metadata:

**Obligatoriskt:**
- App Name: B-ORTIM
- Subtitle: Ortopedisk traumatologi
- Category: Medical / Education
- Screenshots (6.5", 5.5", 12.9" iPad)
- Description (4000 tecken)
- Keywords (100 tecken)
- Support URL
- Privacy Policy URL

**Screenshots storlekar:**
| Enhet | Storlek |
|-------|---------|
| iPhone 6.7" | 1290 x 2796 |
| iPhone 6.5" | 1242 x 2688 |
| iPhone 5.5" | 1242 x 2208 |
| iPad 12.9" | 2048 x 2732 |

### 7. Skicka för granskning

1. Välj build under **App Store**
2. Svara på exportfrågor
3. **Submit for Review**

**Granskningstid:** 1-3 dagar (vanligtvis)

---

## Google Play Store

### 1. Generera signeringsnyckel

```bash
# Första gången - skapa keystore
./scripts/sign-android.sh --generate-keystore

# Spara lösenordet säkert!
```

**VIKTIGT:** Keystore-filen och lösenordet måste sparas för alltid. Du kan aldrig uppdatera appen utan dem.

### 2. Bygg release

```bash
# Bygg release APK och AAB
./scripts/build-mobile.sh android release

# Signera
./scripts/sign-android.sh --all
```

Output:
- `build/android/B-ORTIM-release-signed.apk` (för testning)
- `build/android/B-ORTIM-release-signed.aab` (för Play Store)

### 3. Google Play Console

1. Gå till [play.google.com/console](https://play.google.com/console)
2. **Create app**
3. Fyll i grundinfo:
   - App name: B-ORTIM
   - Default language: Swedish
   - App or game: App
   - Free or paid: Free

### 4. Store listing

Fyll i under **Grow → Store presence → Main store listing**:

**Obligatoriskt:**
- Short description (80 tecken): "Lärplattform för ortopedisk traumatologi"
- Full description (4000 tecken)
- App icon: 512x512 PNG
- Feature graphic: 1024x500 PNG
- Screenshots: min 2 st (phone), helst 8 st
- Phone screenshots: 16:9 eller 9:16
- Tablet screenshots: 16:9 eller 9:16

### 5. App content

Fyll i under **Policy → App content**:

- **Privacy policy**: URL till er privacy policy
- **Ads**: Appen innehåller inga annonser
- **App access**: Appen kräver inloggning
- **Content ratings**: Fyll i frågeformuläret
- **Target audience**: 18+ (medicinsk utbildning)
- **Data safety**: Beskriv vilken data som samlas in

### 6. Ladda upp AAB

1. Gå till **Release → Production**
2. **Create new release**
3. Under **App signing**:
   - Välj "Use Google Play App Signing" (rekommenderat)
   - Eller "Manage my own keys"
4. Ladda upp `.aab`-filen
5. Skriv release notes
6. **Review release**
7. **Start rollout to Production**

**Granskningstid:** Första gången 1-7 dagar, sedan snabbare.

---

## Push-notifikationer

### Firebase Cloud Messaging (Android)

1. Skapa projekt på [console.firebase.google.com](https://console.firebase.google.com)
2. Lägg till Android-app:
   - Package name: `com.bortim.app`
   - Ladda ner `google-services.json`
3. Placera filen:
   ```
   apps/web/android/app/google-services.json
   ```

### Apple Push Notification service (iOS)

Se steg 3 under iOS App Store ovan.

### Server-konfiguration

```env
# .env.production

# Firebase (Android)
FCM_PROJECT_ID=bortim-app
FCM_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----...
FCM_CLIENT_EMAIL=firebase-adminsdk@...

# APNs (iOS)
APNS_KEY_ID=ABC123
APNS_TEAM_ID=XYZ789
APNS_KEY_PATH=/secrets/AuthKey.p8
APNS_BUNDLE_ID=com.bortim.app
```

---

## Felsökning

### iOS

**"Provisioning profile doesn't match"**
```
Xcode → Preferences → Accounts → Download Manual Profiles
```

**"Code signing error"**
```
1. Välj rätt team i Signing & Capabilities
2. Kontrollera bundle identifier
3. Regenerera provisioning profiles
```

**Build misslyckas efter Capacitor sync**
```bash
cd apps/web/ios/App
pod deintegrate
pod install
```

### Android

**"SDK location not found"**
```bash
# Skapa local.properties i android/
echo "sdk.dir=$ANDROID_HOME" > apps/web/android/local.properties
```

**"Keystore was tampered with"**
```bash
# Kontrollera keystore
keytool -list -v -keystore keystore/bortim-release.keystore
```

**Gradle build fails**
```bash
cd apps/web/android
./gradlew clean
./gradlew --stop
./gradlew assembleRelease
```

### Capacitor

**"Web asset directory not found"**
```bash
# Bygg web först
cd apps/web
npm run build
npx cap sync
```

**Plugins fungerar inte**
```bash
# Synka om
npx cap sync

# iOS
cd ios/App && pod install

# Android
cd android && ./gradlew clean
```

---

## Checklista för publicering

### iOS App Store

- [ ] Apple Developer Account ($99/år)
- [ ] App ID skapat
- [ ] Provisioning Profile
- [ ] APNs-nyckel för push
- [ ] App-ikoner (alla storlekar)
- [ ] Screenshots (alla enheter)
- [ ] Privacy Policy URL
- [ ] Support URL
- [ ] App metadata (beskrivning, keywords)
- [ ] Byggt och arkiverat i Xcode
- [ ] Uploadat till App Store Connect
- [ ] Skickat för granskning

### Google Play Store

- [ ] Google Developer Account ($25)
- [ ] Keystore skapad och säkert sparad
- [ ] App-ikon (512x512)
- [ ] Feature graphic (1024x500)
- [ ] Screenshots (telefon + tablet)
- [ ] Privacy Policy URL
- [ ] Fyllt i Data Safety
- [ ] Content ratings
- [ ] Signerad AAB uploadad
- [ ] Skickat för granskning

---

## Kontakter

- **Apple Developer Support**: [developer.apple.com/support](https://developer.apple.com/support)
- **Google Play Support**: [support.google.com/googleplay/android-developer](https://support.google.com/googleplay/android-developer)

---

*Senast uppdaterad: 2024-01-15*
