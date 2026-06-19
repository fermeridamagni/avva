import asyncio
import io
import os
import wave
import sys
import numpy as np
import re
import threading
import time

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pywhispercpp.model import Model

def watchdog():
    ppid = os.getppid()
    while True:
        try:
            os.kill(ppid, 0)
        except OSError:
            # Parent process (PyInstaller bootloader or Tauri app) died, exit immediately.
            os._exit(0)
        time.sleep(1)

threading.Thread(target=watchdog, daemon=True).start()

# Load the whisper model (will download if not present)
print("Loading Whisper model...", file=sys.stderr)
model = Model("base", n_threads=4, print_realtime=False, print_progress=False, language="es")
print("Whisper model loaded.", file=sys.stderr)

app = FastAPI(title="STT Service")

# Allow CORS for the Desktop app
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"status": "STT Service is running"}

import sounddevice as sd

# Find the USB microphone device dynamically
device_id = None
native_samplerate = 16000
devices = sd.query_devices()
for i, dev in enumerate(devices):
    if "USB" in dev['name'] and dev['max_input_channels'] > 0:
        device_id = i
        native_samplerate = int(dev['default_samplerate'])
        break
        
print(f"\n--- Audio Devices ---", file=sys.stderr)
print(f"Selected USB input device: {device_id} at {native_samplerate}Hz", file=sys.stderr)
print("---------------------\n", file=sys.stderr)

# Global state for audio
audio_queue = asyncio.Queue()
active_clients = set()
global_loop = None

def audio_callback(indata, frames, time_info, status):
    if len(active_clients) > 0 and global_loop is not None:
        global_loop.call_soon_threadsafe(audio_queue.put_nowait, indata[:, 0].copy())

async def transcribe_worker():
    audio_buffer = np.array([], dtype=np.float32)
    chunk_size = int(16000 * 1.5)  # 1.5 seconds

    while True:
        chunk = await audio_queue.get()
        
        # If no clients, clear buffer and ignore
        if len(active_clients) == 0:
            audio_buffer = np.array([], dtype=np.float32)
            continue
            
        if native_samplerate != 16000:
            duration = len(chunk) / native_samplerate
            target_len = int(duration * 16000)
            x_old = np.linspace(0, duration, len(chunk))
            x_new = np.linspace(0, duration, target_len)
            chunk = np.interp(x_new, x_old, chunk).astype(np.float32)
            
        audio_buffer = np.concatenate((audio_buffer, chunk))
        
        if len(audio_buffer) >= chunk_size:
            vol = np.max(np.abs(audio_buffer))
            print(f"[STT] Transcribing 1.5s chunk... Max volume: {vol:.4f}", file=sys.stderr)
            
            segments = await asyncio.to_thread(model.transcribe, audio_buffer)
            
            text = " ".join([segment.text for segment in segments]).strip()
            text = re.sub(r'\[.*?\]', '', text).strip()
            
            if text:
                print(f"[STT] Transcrito: {text}", file=sys.stderr)
                for ws in list(active_clients):
                    try:
                        await ws.send_json({"text": text})
                    except Exception:
                        pass
            else:
                print("[STT] (Silencio o ruido ignorado)", file=sys.stderr)
            
            overlap = int(16000 * 0.5)
            audio_buffer = audio_buffer[-overlap:]

@app.on_event("startup")
async def startup_event():
    global global_loop
    global_loop = asyncio.get_running_loop()
    asyncio.create_task(transcribe_worker())
    
    # We open the stream globally so it never gets locked/unlocked
    global_stream = sd.InputStream(device=device_id, samplerate=native_samplerate, channels=1, dtype='float32', callback=audio_callback)
    global_stream.start()
    app.state.global_stream = global_stream
    print("Global audio stream started.", file=sys.stderr)

@app.websocket("/ws/transcribe")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    print(f"Client connected for STT.", file=sys.stderr)

    try:
        while True:
            data = await websocket.receive_json()
            action = data.get("action")
            
            if action == "start":
                active_clients.add(websocket)
            elif action == "stop":
                active_clients.discard(websocket)
                
    except WebSocketDisconnect:
        print("Client disconnected.", file=sys.stderr)
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
    finally:
        active_clients.discard(websocket)
        try:
            await websocket.close()
        except Exception:
            pass

if __name__ == "__main__":
    import uvicorn
    # Default to 8000 but can be configured
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
