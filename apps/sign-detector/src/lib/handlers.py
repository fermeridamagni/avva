import json
import os
import queue
import sys
import threading

from dotenv import load_dotenv
from websocket import create_connection

# When running as a PyInstaller bundle, .env lives next to the executable;
# in development it's found via the normal cwd-based search.
if getattr(sys, "frozen", False):
    load_dotenv(os.path.join(os.path.dirname(sys.executable), ".env"))
else:
    load_dotenv()

WS_SERVER_URL = os.getenv("WS_SERVER_URL", "ws://localhost:3000/events")

# Global variables for persistent connection
_ws = None
_ws_lock = threading.Lock()

# ---------------------------------------------------------------------------
# Queue-based sender — avoids spawning a new thread per gesture event.
# On Linux/ARM, thread creation costs ~0.5-1 ms each; a persistent worker
# thread with a bounded queue eliminates that overhead entirely.
# ---------------------------------------------------------------------------
_send_queue: queue.Queue[str] = queue.Queue(maxsize=16)


def _get_connection():
    global _ws
    if not WS_SERVER_URL:
        return None

    if _ws is None or not _ws.connected:
        try:
            print(f"Connecting to WebSocket Server: {WS_SERVER_URL}")
            _ws = create_connection(WS_SERVER_URL, timeout=5.0)
            # Receive initial connection message
            _ws.recv()
        except Exception as e:
            print(f"Failed to connect to WebSocket server: {e}")
            _ws = None
    return _ws


def _send_request(sign: str):
    """Send a single sign event to the WebSocket server over a persistent connection."""
    with _ws_lock:
        ws = _get_connection()
        if not ws:
            return

        try:
            print(f"Sending sign to WebSocket Server: {sign}")
            payload = json.dumps({"type": "sign", "sign": sign})
            ws.send(payload)
            acknowledgement = ws.recv()
            print(f"WebSocket server acknowledged the command: {acknowledgement}")
        except Exception as e:
            print(f"Failed to communicate with WebSocket server: {e}")
            # Reset connection on failure
            global _ws
            if _ws:
                _ws.close()
                _ws = None


def _send_worker():
    """Background worker that drains the send queue."""
    while True:
        sign = _send_queue.get()
        if sign is None:
            break  # Poison pill for clean shutdown.
        _send_request(sign)


# Start a single persistent worker thread (daemon so it dies with the process).
_worker = threading.Thread(target=_send_worker, daemon=True)
_worker.start()


def send_to_server(sign: str):
    """Queue the detected sign for async WebSocket delivery.

    If the queue is full (16 items), the event is silently dropped
    because stale gestures are not useful.
    """
    try:
        _send_queue.put_nowait(sign)
    except queue.Full:
        pass  # Drop stale gestures — only the latest matters.
