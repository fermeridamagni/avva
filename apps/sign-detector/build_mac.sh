#!/bin/bash
set -e

# Sync dependencies
uv sync

# Build with PyInstaller
uv run pyinstaller --onefile \
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
