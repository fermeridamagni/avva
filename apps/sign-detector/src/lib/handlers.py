import json
import threading
import os
from websocket import create_connection
from dotenv import load_dotenv

load_dotenv()  # Load environment variables before importing modules that read them.

WS_SERVER_URL = os.getenv("WS_SERVER_URL")

# Global variables for persistent connection
_ws = None
_ws_lock = threading.Lock()


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


def send_to_server(sign: str):
    """Send the detected sign to the server via WebSocket asynchronously."""
    threading.Thread(target=_send_request, args=(sign,), daemon=True).start()
