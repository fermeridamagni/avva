#!/bin/bash
set -e

source "$HOME/.cargo/env"
export PATH="$HOME/.bun/bin:$PATH"

echo "Building gateway-api sidecar..."
cd ~/Workspace/avva/apps/gateway-api
bun install
bun run build.ts

echo "Building sign-detector sidecar..."
cd ~/Workspace/avva/apps/sign-detector
uv sync
uv run pyinstaller --onefile --distpath ../desktop/src-tauri/sidecars --name sign-detector-aarch64-unknown-linux-gnu src/main.py

cd ~/Workspace/avva/apps/desktop
echo "Building Tauri App..."
bun run tauri build --bundles deb

echo "Installing the compiled .deb package..."
DEB_FILE=$(find src-tauri/target/release/bundle/deb -name "*.deb" | head -n 1)
if [ -n "$DEB_FILE" ]; then
    echo "123" | sudo -S dpkg -i "$DEB_FILE" || echo "123" | sudo -S apt-get install -f -y
    echo "Installation successful!"
else
    echo "Could not find .deb package to install."
    exit 1
fi
