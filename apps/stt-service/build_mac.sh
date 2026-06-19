#!/bin/bash
set -e

# Sync dependencies
uv sync

# Clean previous build artifacts to avoid stale caches
rm -rf build dist *.spec

# Build with PyInstaller
uv run pyinstaller --onefile --clean \
    --distpath ../desktop/src-tauri/sidecars \
    --name stt-service-aarch64-apple-darwin \
    src/main.py

# macOS Codesigning (required to run locally on Mac)
if [ "$(uname)" == "Darwin" ]; then
    echo "Codesigning the macOS executable..."
    codesign --remove-signature ../desktop/src-tauri/sidecars/stt-service-aarch64-apple-darwin || true
    codesign --force --deep --sign - ../desktop/src-tauri/sidecars/stt-service-aarch64-apple-darwin
    
    # Create a copy for x86_64 to ensure compatibility during Tauri dev on Apple Silicon
    cp ../desktop/src-tauri/sidecars/stt-service-aarch64-apple-darwin ../desktop/src-tauri/sidecars/stt-service-x86_64-apple-darwin
    echo "Codesign complete."
fi
