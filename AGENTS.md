# Project Guidelines

## Rules

- Document and explain why the code is for.
- Always use UV as the package manager for Python development.
- Always use TypeScript instead of Javascript.
- Always use Bun as the package manager and runtime environment instead of npm or Node.js.
- Use Ultracite (Biome's zero-config preset) for code formatting and linting.

## Development

### Setup

#### Sign Detector (Python)

```bash
# Navigate to the sign-detector app directory
cd apps/sign-detector

# Install dependencies
uv sync

# Run the application (use libcamerify on Raspberry Pi for camera access)
libcamerify uv run src/main.py
```

#### Desktop App (Tauri v2 with Typescript and React)

```bash 
# Navigate to the desktop-app directory
cd apps/desktop-app

# Install dependencies
bun install

# Run the application
bun run tauri dev
```

#### Demo API (Hono with Typescript)

```bash
# Navigate to the demo-api directory
cd apps/demo-api

# Install dependencies
bun install

# Run the application
bun run dev
```

## References

- [Ultracite Code Standards](ULTRACITE.md).
