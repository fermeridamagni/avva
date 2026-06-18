#!/bin/bash
set -e

echo "Installing system updates and base dependencies..."
echo "123" | sudo -S apt-get update
echo "123" | sudo -S apt-get install -y curl wget git build-essential mosquitto mosquitto-clients

echo "Installing Rust..."
if ! command -v rustc &> /dev/null; then
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
fi
source "$HOME/.cargo/env"

echo "Installing Tauri System Dependencies..."
echo "123" | sudo -S apt-get install -y libwebkit2gtk-4.1-dev libappindicator3-dev librsvg2-dev patchelf libxdo-dev libssl-dev

echo "Installing Bun..."
if ! command -v bun &> /dev/null; then
    curl -fsSL https://bun.sh/install | bash
fi
export BUN_INSTALL="$HOME/.bun"
export PATH="$BUN_INSTALL/bin:$PATH"

echo "Installing UV..."
if ! command -v uv &> /dev/null; then
    curl -LsSf https://astral.sh/uv/install.sh | sh
fi
export PATH="$HOME/.local/bin:$PATH"

echo "Entering project directory..."
cd ~/Workspace/avva

echo "Setting up sign-detector..."
cd apps/sign-detector
uv sync
cd ../..

echo "Setting up gateway-api..."
cd apps/gateway-api
bun install
cd ../..

echo "Setting up desktop app..."
cd apps/desktop
bun install

echo "Building the desktop app..."
bun run build

echo "Installing the compiled .deb package..."
DEB_FILE=$(find src-tauri/target/release/bundle/deb -name "*.deb" | head -n 1)
if [ -n "$DEB_FILE" ]; then
    echo "123" | sudo -S dpkg -i "$DEB_FILE" || echo "123" | sudo -S apt-get install -f -y
    echo "Installation successful!"
else
    echo "Could not find .deb package to install."
    exit 1
fi
