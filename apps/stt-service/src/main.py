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
model = Model("small", n_threads=4, print_realtime=False, print_progress=False, language="es")
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

@app.websocket("/ws/transcribe")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    print("Client connected for STT.", file=sys.stderr)
    
    import sounddevice as sd
    
    # Debug: print available devices
    print("\n--- Audio Devices ---", file=sys.stderr)
    print(sd.query_devices(), file=sys.stderr)
    print(f"Default input device: {sd.default.device[0]}", file=sys.stderr)
    print("---------------------\n", file=sys.stderr)
    
    loop = asyncio.get_running_loop()
    audio_queue = asyncio.Queue()
    is_recording = False
    
    def audio_callback(indata, frames, time_info, status):
        if status:
            print(f"Audio status: {status}", file=sys.stderr)
        if is_recording:
            loop.call_soon_threadsafe(audio_queue.put_nowait, indata[:, 0].copy())

    async def transcribe_worker():
        audio_buffer = np.array([], dtype=np.float32)
        chunk_size = int(16000 * 1.5)  # 1.5 seconds

        while True:
            chunk = await audio_queue.get()
            audio_buffer = np.concatenate((audio_buffer, chunk))
            
            if len(audio_buffer) >= chunk_size:
                vol = np.max(np.abs(audio_buffer))
                print(f"[STT] Transcribing 1.5s chunk... Max volume: {vol:.4f}", file=sys.stderr)
                
                segments = await asyncio.to_thread(model.transcribe, audio_buffer)
                
                text = " ".join([segment.text for segment in segments]).strip()
                text = re.sub(r'\[.*?\]', '', text).strip()
                
                if text:
                    await websocket.send_json({"text": text})
                
                overlap = int(16000 * 0.5)
                audio_buffer = audio_buffer[-overlap:]

    worker_task = None
    stream = None

    try:
        while True:
            data = await websocket.receive_json()
            action = data.get("action")
            
            if action == "start":
                if not is_recording:
                    is_recording = True
                    worker_task = asyncio.create_task(transcribe_worker())
                    stream = sd.InputStream(samplerate=16000, channels=1, dtype='float32', callback=audio_callback)
                    stream.start()
            elif action == "stop":
                is_recording = False
                if stream:
                    stream.stop()
                    stream.close()
                    stream = None
                if worker_task:
                    worker_task.cancel()
                    worker_task = None
                
    except WebSocketDisconnect:
        print("Client disconnected.", file=sys.stderr)
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
    finally:
        is_recording = False
        if stream:
            stream.stop()
            stream.close()
        if worker_task:
            worker_task.cancel()
        try:
            await websocket.close()
        except Exception:
            pass

if __name__ == "__main__":
    import uvicorn
    # Default to 8000 but can be configured
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
