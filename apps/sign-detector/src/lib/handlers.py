import json
import threading
import os
from websocket import create_connection

WS_SERVER_URL = os.getenv("WS_SERVER_URL")

def _send_request(sign: str):
    """Send a single sign event to the WebSocket server."""
    if not WS_SERVER_URL:
        print("Missing WS_SERVER_URL.")
        return

    try:
        print(f"Sending sign to WebSocket Server: {WS_SERVER_URL}")
        payload = json.dumps({"type": "sign", "sign": sign})
        ws = create_connection(WS_SERVER_URL, timeout=2.0)
        try:
            ws.send(payload)
            acknowledgement = ws.recv()
            print(f"WebSocket server acknowledged the command: {acknowledgement}")
        finally:
            ws.close()
    except Exception as e:
        print(f"Failed to reach WebSocket server: {e}")

def send_to_server(sign: str):
    """Send the detected sign to the server via WebSocket asynchronously."""
    threading.Thread(target=_send_request, args=(sign,), daemon=True).start()

  
