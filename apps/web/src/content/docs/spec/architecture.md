---
title: System Architecture
description: Overview of the AVVA ecosystem architecture
---

AVVA is a distributed ecosystem designed to provide an AI-powered assistant for Deaf-Mute people. The architecture relies on an interconnected network of applications running on diverse hardware to capture, translate, and communicate seamlessly.

## Monorepo Structure

The project is structured as a **Turborepo** workspace, utilizing `bun` as the primary package manager. The repository consists of the following key applications under the `apps/` directory:

- **Desktop Hub** (`apps/desktop`)
- **Gateway API** (`apps/gateway-api`)
- **Sign Detector** (`apps/sign-detector`)
- **Speech-to-Text Service** (`apps/stt-service`)
- **Arduino Firmware** (`apps/arduino-firmware`)
- **Documentation Website** (`apps/web`)

## Application Components

### Desktop Hub
The Desktop Hub acts as the primary user interface and control center for the AVVA ecosystem. 
- **Tech Stack:** Tauri v2, React, TypeScript, Tailwind CSS, Shadcn UI.
- **Responsibility:** Connects with the Gateway API to receive real-time notifications when a sign is detected and displays toast notifications to the user using Sonner.

### Sign Detector
The core AI application that detects and interprets sign language in real-time.
- **Tech Stack:** Python, MediaPipe, OpenCV (`hand_landmarker.task`), `uv` for package management.
- **Hardware Context:** Runs natively on a Raspberry Pi 5 with an Arducam IMX415 camera and an official 7" DSI display.
- **Execution Environment:** Runs headlessly in production, capturing frames using `libcamerify` to bypass V4L2 limitations on modern Raspberry Pi OS versions.

### Gateway API
A central robust API acting as the brain of the network.
- **Tech Stack:** Hono, TypeScript.
- **Responsibility:** Operates on the local network (e.g., hosted on the Raspberry Pi) to receive sign detection events and dispatch them to connected clients (like the Desktop Hub) and distributed IoT devices.

### Speech-to-Text (STT) Service
A microservice for converting spoken words into text, providing an alternate mode of communication.
- **Tech Stack:** Python, Whisper (small model).
- **Responsibility:** Processes audio streams and returns transcribed text to the Gateway API or directly to the Desktop Hub.

### Arduino Firmware
Firmware for distributed microcontrollers in the AVVA ecosystem.
- **Responsibility:** Controls physical output devices (like household lighting or alerts) based on commands dispatched by the Gateway API, bridging the gap between digital AI translation and physical world actions.

## Communication Flow

1. The **Sign Detector** on the Raspberry Pi captures continuous video feed using the Arducam.
2. The AI model detects a specific sign language gesture.
3. The Sign Detector sends an event payload to the **Gateway API**.
4. The **Gateway API** broadcasts the event to all connected clients.
5. The **Desktop Hub** receives the event and displays a notification to the user.
6. Alternatively, the Gateway API triggers the **Arduino Firmware** to execute a physical action.
