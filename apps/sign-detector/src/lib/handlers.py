import requests
import threading
import os

# Replace with your Arduino Uno R4 WiFi's IP address
ARDUINO_URL = os.getenv("HOME_ASSISTANT_ARDUINO_URL")

def _send_request(endpoint: str):
    try:
        url = f"{ARDUINO_URL}/{endpoint}"
        print(f"Sending request to Arduino: {url}")
        resp = requests.get(url, timeout=2.0)
        if resp.status_code == 200:
            print("Arduino acknowledged the command.")
        else:
            print(f"Arduino returned status {resp.status_code}.")
    except Exception as e:
        print(f"Failed to reach Arduino: {e}")

def send_to_server(sign: str):
    """Sends the detected sign to the Arduino server via HTTP GET asynchronously."""
    threading.Thread(target=_send_request, args=(sign,), daemon=True).start()

  
