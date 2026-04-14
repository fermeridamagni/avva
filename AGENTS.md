# Project Guidelines

## Development

### Launch Commands

#### Sign Detector (Python)

```bash
# Navigate to the sign-detector app directory
cd apps/sign-detector

# Install dependencies
uv sync

# Run the application
uv run src/main.py
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

### Rules

- Document everything, including code, functions and classes.
- Always use UV as the package manager for Python development.
- Always use Bun as the package manager and runtime environment for Typescript development.
- Use Ultracite (Biome's zero-config preset) for code formatting and linting.

## References

- [Ultracite Code Standards](/.github/instructions/ultracite.instructions.md).