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
    
    # Accumulate audio data. Whisper performs best with 1-3 seconds minimum.
    audio_buffer = np.array([], dtype=np.float32)
    chunk_size = int(16000 * 1.5)  # 1.5 seconds

    try:
        while True:
            # We expect audio data as raw 16kHz, 16-bit, mono PCM bytes
            data = await websocket.receive_bytes()
            
            # Convert raw bytes to numpy array
            chunk = np.frombuffer(data, dtype=np.int16).astype(np.float32) / 32768.0
            audio_buffer = np.concatenate((audio_buffer, chunk))
            
            if len(audio_buffer) >= chunk_size:
                # Transcribe the audio chunk
                segments = await asyncio.to_thread(model.transcribe, audio_buffer)
                
                text = " ".join([segment.text for segment in segments]).strip()
                
                # Remove any tags like [Música], [BLANK_AUDIO], etc.
                text = re.sub(r'\[.*?\]', '', text).strip()
                
                # If there's still text left after stripping tags
                if text:
                    await websocket.send_json({"text": text})
                
                # Keep a small overlap for the next transcription context (0.5 seconds)
                overlap = int(16000 * 0.5)
                audio_buffer = audio_buffer[-overlap:]
                
    except WebSocketDisconnect:
        print("Client disconnected.", file=sys.stderr)
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        try:
            await websocket.close()
        except Exception:
            pass

if __name__ == "__main__":
    import uvicorn
    # Default to 8000 but can be configured
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
