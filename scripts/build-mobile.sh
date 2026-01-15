#!/bin/bash
# ===========================================
# B-ORTIM Mobile App Build Script
# ===========================================
set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }
log_step() { echo -e "${BLUE}[STEP]${NC} $1"; }

# Configuration
PLATFORM="${1:-}"
BUILD_TYPE="${2:-release}"
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WEB_DIR="${PROJECT_DIR}/apps/web"

usage() {
    echo "Usage: $0 <platform> [build_type]"
    echo ""
    echo "Platforms:"
    echo "  ios       - Build for iOS"
    echo "  android   - Build for Android"
    echo "  both      - Build for both platforms"
    echo ""
    echo "Build types:"
    echo "  debug     - Debug build"
    echo "  release   - Release build (default)"
    echo ""
    echo "Examples:"
    echo "  $0 ios release"
    echo "  $0 android debug"
    echo "  $0 both"
    exit 1
}

check_requirements() {
    log_step "Checking requirements..."

    # Check Node.js
    if ! command -v node &> /dev/null; then
        log_error "Node.js is not installed"
        exit 1
    fi

    # Check npm
    if ! command -v npm &> /dev/null; then
        log_error "npm is not installed"
        exit 1
    fi

    if [ "$PLATFORM" = "ios" ] || [ "$PLATFORM" = "both" ]; then
        # Check Xcode (macOS only)
        if [[ "$OSTYPE" == "darwin"* ]]; then
            if ! command -v xcodebuild &> /dev/null; then
                log_error "Xcode is not installed. Install from App Store."
                exit 1
            fi

            # Check CocoaPods
            if ! command -v pod &> /dev/null; then
                log_warn "CocoaPods not installed. Installing..."
                sudo gem install cocoapods
            fi
        else
            log_error "iOS builds require macOS"
            exit 1
        fi
    fi

    if [ "$PLATFORM" = "android" ] || [ "$PLATFORM" = "both" ]; then
        # Check Android SDK
        if [ -z "${ANDROID_HOME:-}" ] && [ -z "${ANDROID_SDK_ROOT:-}" ]; then
            log_error "ANDROID_HOME or ANDROID_SDK_ROOT not set"
            log_error "Install Android Studio and set environment variable"
            exit 1
        fi

        # Check Java
        if ! command -v java &> /dev/null; then
            log_error "Java is not installed"
            exit 1
        fi
    fi

    log_info "Requirements check passed"
}

build_web() {
    log_step "Building web app..."

    cd "$WEB_DIR"

    # Set production environment
    export NODE_ENV=production

    # Build the web app
    npm run build

    log_info "Web build completed"
}

sync_capacitor() {
    log_step "Syncing Capacitor..."

    cd "$WEB_DIR"

    # Add platforms if they don't exist
    if [ "$PLATFORM" = "ios" ] || [ "$PLATFORM" = "both" ]; then
        if [ ! -d "ios" ]; then
            log_info "Adding iOS platform..."
            npx cap add ios
        fi
    fi

    if [ "$PLATFORM" = "android" ] || [ "$PLATFORM" = "both" ]; then
        if [ ! -d "android" ]; then
            log_info "Adding Android platform..."
            npx cap add android
        fi
    fi

    # Sync web assets to native projects
    npx cap sync

    log_info "Capacitor sync completed"
}

build_ios() {
    log_step "Building iOS app..."

    cd "$WEB_DIR/ios/App"

    # Install pods
    log_info "Installing CocoaPods dependencies..."
    pod install

    if [ "$BUILD_TYPE" = "release" ]; then
        log_info "Building release archive..."

        # Clean build folder
        xcodebuild clean -workspace App.xcworkspace -scheme App -configuration Release

        # Archive
        xcodebuild archive \
            -workspace App.xcworkspace \
            -scheme App \
            -configuration Release \
            -archivePath "${PROJECT_DIR}/build/ios/B-ORTIM.xcarchive" \
            CODE_SIGN_IDENTITY="" \
            CODE_SIGNING_REQUIRED=NO \
            CODE_SIGNING_ALLOWED=NO

        log_info "iOS archive created: ${PROJECT_DIR}/build/ios/B-ORTIM.xcarchive"
        log_warn "To export IPA, open Xcode and use Product > Archive > Distribute App"
    else
        log_info "Building debug..."
        xcodebuild build \
            -workspace App.xcworkspace \
            -scheme App \
            -configuration Debug \
            -destination 'generic/platform=iOS Simulator'
    fi

    log_info "iOS build completed"
}

build_android() {
    log_step "Building Android app..."

    cd "$WEB_DIR/android"

    if [ "$BUILD_TYPE" = "release" ]; then
        log_info "Building release APK/AAB..."

        # Clean
        ./gradlew clean

        # Build release APK
        ./gradlew assembleRelease

        # Build release AAB (for Play Store)
        ./gradlew bundleRelease

        # Copy outputs
        mkdir -p "${PROJECT_DIR}/build/android"

        if [ -f "app/build/outputs/apk/release/app-release-unsigned.apk" ]; then
            cp "app/build/outputs/apk/release/app-release-unsigned.apk" \
               "${PROJECT_DIR}/build/android/B-ORTIM-release.apk"
            log_info "APK: ${PROJECT_DIR}/build/android/B-ORTIM-release.apk"
        fi

        if [ -f "app/build/outputs/bundle/release/app-release.aab" ]; then
            cp "app/build/outputs/bundle/release/app-release.aab" \
               "${PROJECT_DIR}/build/android/B-ORTIM-release.aab"
            log_info "AAB: ${PROJECT_DIR}/build/android/B-ORTIM-release.aab"
        fi

        log_warn "Note: Release builds need to be signed before publishing"
        log_warn "See: ./scripts/sign-android.sh"
    else
        log_info "Building debug APK..."
        ./gradlew assembleDebug

        mkdir -p "${PROJECT_DIR}/build/android"
        cp "app/build/outputs/apk/debug/app-debug.apk" \
           "${PROJECT_DIR}/build/android/B-ORTIM-debug.apk"

        log_info "APK: ${PROJECT_DIR}/build/android/B-ORTIM-debug.apk"
    fi

    log_info "Android build completed"
}

# Main
main() {
    if [ -z "$PLATFORM" ]; then
        usage
    fi

    if [ "$PLATFORM" != "ios" ] && [ "$PLATFORM" != "android" ] && [ "$PLATFORM" != "both" ]; then
        log_error "Invalid platform: $PLATFORM"
        usage
    fi

    log_info "=========================================="
    log_info "  B-ORTIM Mobile Build"
    log_info "=========================================="
    log_info "Platform: $PLATFORM"
    log_info "Build type: $BUILD_TYPE"
    log_info ""

    check_requirements
    build_web
    sync_capacitor

    if [ "$PLATFORM" = "ios" ] || [ "$PLATFORM" = "both" ]; then
        build_ios
    fi

    if [ "$PLATFORM" = "android" ] || [ "$PLATFORM" = "both" ]; then
        build_android
    fi

    log_info ""
    log_info "=========================================="
    log_info "  Build completed successfully!"
    log_info "=========================================="
    log_info ""
    log_info "Output directory: ${PROJECT_DIR}/build/"
}

main "$@"
