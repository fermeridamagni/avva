---
title: Arquitectura del Sistema
description: Visión general de la arquitectura del ecosistema AVVA
---

AVVA es un ecosistema distribuido diseñado para proporcionar un asistente impulsado por inteligencia artificial para personas sordomudas. La arquitectura se basa en una red interconectada de aplicaciones que se ejecutan en hardware diverso para capturar, traducir y comunicar sin interrupciones.

## Estructura del Monorepo

El proyecto está estructurado como un espacio de trabajo **Turborepo**, utilizando `bun` como el administrador de paquetes principal. El repositorio consta de las siguientes aplicaciones clave bajo el directorio `apps/`:

- **Desktop Hub** (`apps/desktop`)
- **Gateway API** (`apps/gateway-api`)
- **Detector de Señas** (`apps/sign-detector`)
- **Servicio de Voz a Texto** (`apps/stt-service`)
- **Firmware de Arduino** (`apps/arduino-firmware`)
- **Sitio Web de Documentación** (`apps/web`)

## Componentes de la Aplicación

### Desktop Hub (Hub de Escritorio)
El Hub de Escritorio actúa como la interfaz de usuario principal y centro de control del ecosistema AVVA.
- **Stack Tecnológico:** Tauri v2, React, TypeScript, Tailwind CSS, Shadcn UI.
- **Responsabilidad:** Se conecta con la Gateway API para recibir notificaciones en tiempo real cuando se detecta una seña y muestra alertas "toast" al usuario usando Sonner.

### Detector de Señas
La aplicación principal de IA que detecta e interpreta el lenguaje de señas en tiempo real.
- **Stack Tecnológico:** Python, MediaPipe, OpenCV (`hand_landmarker.task`), `uv` para gestión de paquetes.
- **Contexto de Hardware:** Se ejecuta de forma nativa en una Raspberry Pi 5 con una cámara Arducam IMX415 y una pantalla DSI oficial de 7".
- **Entorno de Ejecución:** Se ejecuta de forma desatendida (headless) en producción, capturando imágenes mediante `libcamerify` para evitar las limitaciones de V4L2 en las versiones modernas del SO de la Raspberry Pi.

### Gateway API
Una API central robusta que actúa como el cerebro de la red.
- **Stack Tecnológico:** Hono, TypeScript.
- **Responsabilidad:** Opera en la red local (por ejemplo, alojada en la Raspberry Pi) para recibir eventos de detección de señas y despacharlos a los clientes conectados (como el Desktop Hub) y a dispositivos IoT distribuidos.

### Servicio de Voz a Texto (STT)
Un microservicio para convertir palabras habladas a texto, proporcionando un modo alternativo de comunicación.
- **Stack Tecnológico:** Python, Whisper (modelo pequeño).
- **Responsabilidad:** Procesa flujos de audio y devuelve el texto transcrito a la Gateway API o directamente al Desktop Hub.

### Firmware de Arduino
Firmware para microcontroladores distribuidos en el ecosistema AVVA.
- **Responsabilidad:** Controla dispositivos físicos de salida (como iluminación del hogar o alertas) basados en los comandos enviados por la Gateway API, cerrando la brecha entre la traducción digital de IA y las acciones en el mundo físico.

## Flujo de Comunicación

1. El **Detector de Señas** en la Raspberry Pi captura una transmisión de video continua usando la cámara Arducam.
2. El modelo de IA detecta un gesto específico de lenguaje de señas.
3. El Detector de Señas envía un evento de información a la **Gateway API**.
4. La **Gateway API** transmite el evento a todos los clientes conectados.
5. El **Desktop Hub** recibe el evento y muestra una notificación al usuario.
6. Alternativamente, la Gateway API le da la orden al **Firmware de Arduino** para que ejecute una acción física.
