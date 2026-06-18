#!/bin/bash
set -e

# Sync dependencies
uv sync

# Clean previous build artifacts to avoid stale caches
rm -rf build dist *.spec

# Build with PyInstaller
uv run pyinstaller --onefile --clean \
    --hidden-import cv2 \
    --hidden-import mediapipe \
    --distpath ../desktop/src-tauri/sidecars \
    --name sign-detector-aarch64-apple-darwin \
    src/main.py

# macOS Codesigning (required to run locally on Mac)
if [ "$(uname)" == "Darwin" ]; then
    echo "Codesigning the macOS executable..."
    codesign --remove-signature ../desktop/src-tauri/sidecars/sign-detector-aarch64-apple-darwin || true
    codesign -s - ../desktop/src-tauri/sidecars/sign-detector-aarch64-apple-darwin
    echo "Codesign complete."
fi
