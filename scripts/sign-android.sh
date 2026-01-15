#!/bin/bash
# ===========================================
# B-ORTIM Android App Signing Script
# ===========================================
set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Configuration
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BUILD_DIR="${PROJECT_DIR}/build/android"
KEYSTORE_PATH="${KEYSTORE_PATH:-${PROJECT_DIR}/keystore/bortim-release.keystore}"
KEY_ALIAS="${KEY_ALIAS:-bortim}"

usage() {
    echo "Usage: $0 [options]"
    echo ""
    echo "Options:"
    echo "  --generate-keystore   Generate a new release keystore"
    echo "  --sign-apk           Sign the release APK"
    echo "  --sign-aab           Sign the release AAB"
    echo "  --all                Sign both APK and AAB"
    echo ""
    echo "Environment variables:"
    echo "  KEYSTORE_PATH        Path to keystore file"
    echo "  KEYSTORE_PASSWORD    Keystore password"
    echo "  KEY_ALIAS            Key alias"
    echo "  KEY_PASSWORD         Key password"
    exit 1
}

generate_keystore() {
    log_info "Generating release keystore..."

    mkdir -p "$(dirname "$KEYSTORE_PATH")"

    if [ -f "$KEYSTORE_PATH" ]; then
        log_warn "Keystore already exists: $KEYSTORE_PATH"
        read -p "Overwrite? (y/N) " confirm
        if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
            log_info "Keeping existing keystore"
            return
        fi
        rm "$KEYSTORE_PATH"
    fi

    echo ""
    echo "=== Keystore Generation ==="
    echo "You will be prompted for:"
    echo "1. Keystore password (remember this!)"
    echo "2. Key password (can be same as keystore)"
    echo "3. Your name/organization details"
    echo ""

    keytool -genkeypair \
        -v \
        -storetype PKCS12 \
        -keystore "$KEYSTORE_PATH" \
        -alias "$KEY_ALIAS" \
        -keyalg RSA \
        -keysize 2048 \
        -validity 10000

    log_info "Keystore generated: $KEYSTORE_PATH"
    log_warn "IMPORTANT: Keep this file and password safe!"
    log_warn "You will need them for all future app updates."
}

sign_apk() {
    log_info "Signing APK..."

    local unsigned_apk="${BUILD_DIR}/B-ORTIM-release.apk"
    local signed_apk="${BUILD_DIR}/B-ORTIM-release-signed.apk"
    local aligned_apk="${BUILD_DIR}/B-ORTIM-release-aligned.apk"

    if [ ! -f "$unsigned_apk" ]; then
        log_error "Unsigned APK not found: $unsigned_apk"
        log_error "Run ./scripts/build-mobile.sh android release first"
        exit 1
    fi

    if [ ! -f "$KEYSTORE_PATH" ]; then
        log_error "Keystore not found: $KEYSTORE_PATH"
        log_error "Run ./scripts/sign-android.sh --generate-keystore first"
        exit 1
    fi

    # Get passwords
    if [ -z "${KEYSTORE_PASSWORD:-}" ]; then
        read -s -p "Keystore password: " KEYSTORE_PASSWORD
        echo ""
    fi

    if [ -z "${KEY_PASSWORD:-}" ]; then
        KEY_PASSWORD="$KEYSTORE_PASSWORD"
    fi

    # Sign APK
    log_info "Signing with jarsigner..."
    jarsigner -verbose \
        -sigalg SHA256withRSA \
        -digestalg SHA-256 \
        -keystore "$KEYSTORE_PATH" \
        -storepass "$KEYSTORE_PASSWORD" \
        -keypass "$KEY_PASSWORD" \
        -signedjar "$signed_apk" \
        "$unsigned_apk" \
        "$KEY_ALIAS"

    # Verify signature
    log_info "Verifying signature..."
    jarsigner -verify -verbose -certs "$signed_apk"

    # Align APK (required for Play Store)
    log_info "Aligning APK with zipalign..."
    if command -v zipalign &> /dev/null; then
        zipalign -v 4 "$signed_apk" "$aligned_apk"
        rm "$signed_apk"
        mv "$aligned_apk" "$signed_apk"
    else
        # Try to find zipalign in Android SDK
        local zipalign_path="${ANDROID_HOME:-${ANDROID_SDK_ROOT:-}}/build-tools/*/zipalign"
        if ls $zipalign_path 1> /dev/null 2>&1; then
            local zipalign_bin=$(ls $zipalign_path | tail -1)
            $zipalign_bin -v 4 "$signed_apk" "$aligned_apk"
            rm "$signed_apk"
            mv "$aligned_apk" "$signed_apk"
        else
            log_warn "zipalign not found, skipping alignment"
        fi
    fi

    log_info "Signed APK: $signed_apk"
}

sign_aab() {
    log_info "Signing AAB (Android App Bundle)..."

    local unsigned_aab="${BUILD_DIR}/B-ORTIM-release.aab"
    local signed_aab="${BUILD_DIR}/B-ORTIM-release-signed.aab"

    if [ ! -f "$unsigned_aab" ]; then
        log_error "Unsigned AAB not found: $unsigned_aab"
        log_error "Run ./scripts/build-mobile.sh android release first"
        exit 1
    fi

    if [ ! -f "$KEYSTORE_PATH" ]; then
        log_error "Keystore not found: $KEYSTORE_PATH"
        log_error "Run ./scripts/sign-android.sh --generate-keystore first"
        exit 1
    fi

    # Get passwords
    if [ -z "${KEYSTORE_PASSWORD:-}" ]; then
        read -s -p "Keystore password: " KEYSTORE_PASSWORD
        echo ""
    fi

    if [ -z "${KEY_PASSWORD:-}" ]; then
        KEY_PASSWORD="$KEYSTORE_PASSWORD"
    fi

    # Sign AAB with jarsigner
    log_info "Signing with jarsigner..."
    cp "$unsigned_aab" "$signed_aab"
    jarsigner -verbose \
        -sigalg SHA256withRSA \
        -digestalg SHA-256 \
        -keystore "$KEYSTORE_PATH" \
        -storepass "$KEYSTORE_PASSWORD" \
        -keypass "$KEY_PASSWORD" \
        "$signed_aab" \
        "$KEY_ALIAS"

    # Verify signature
    log_info "Verifying signature..."
    jarsigner -verify -verbose "$signed_aab"

    log_info "Signed AAB: $signed_aab"
}

# Parse arguments
if [ $# -eq 0 ]; then
    usage
fi

case "$1" in
    --generate-keystore)
        generate_keystore
        ;;
    --sign-apk)
        sign_apk
        ;;
    --sign-aab)
        sign_aab
        ;;
    --all)
        sign_apk
        sign_aab
        ;;
    *)
        usage
        ;;
esac

log_info "Done!"
