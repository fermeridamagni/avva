#!/bin/bash
set -e

source "$HOME/.cargo/env"
export PATH="$HOME/.bun/bin:$PATH"

cd ~/Workspace/avva/apps/desktop
echo "Building Tauri App..."
bun run tauri build

echo "Installing the compiled .deb package..."
DEB_FILE=$(find src-tauri/target/release/bundle/deb -name "*.deb" | head -n 1)
if [ -n "$DEB_FILE" ]; then
    echo "123" | sudo -S dpkg -i "$DEB_FILE" || echo "123" | sudo -S apt-get install -f -y
    echo "Installation successful!"
else
    echo "Could not find .deb package to install."
    exit 1
fi
