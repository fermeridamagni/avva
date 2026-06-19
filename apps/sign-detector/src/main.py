import os
import signal
import time

import numpy as np
import sys

# Re-launch with libcamerify if on Linux ARM and not already wrapped.
# The Pi 5 camera requires libcamera, but OpenCV cv2.VideoCapture(0) tries V4L2.
# libcamerify intercepts V4L2 calls using LD_PRELOAD.
# If running over SSH without a display exported, default to the Pi's primary screen
if os.name == "posix" and "DISPLAY" not in os.environ:
    os.environ["DISPLAY"] = ":0"

import cv2
import mediapipe as mp
from dotenv import load_dotenv

import lib.utils as utils
from lib.handlers import send_to_server
from lib.helpers import detect_one_hand_gesture, detect_two_hand_gesture

import sys

# When running as a PyInstaller bundle, .env lives next to the executable;
# in development it's found via the normal cwd-based search.
if getattr(sys, "frozen", False):
    load_dotenv(os.path.join(os.path.dirname(sys.executable), ".env"))
else:
    load_dotenv()

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

# Camera index.  0 is usually the built-in FaceTime HD camera on macOS.
# If an iPhone is acting as a Continuity Camera, try index 1.
# Can also be a GStreamer pipeline string or network stream URL.
camera_env = os.getenv("CAMERA_INDEX", "0")
try:
    CAMERA_INDEX = int(camera_env)
except ValueError:
    CAMERA_INDEX = camera_env

# Capture resolution — defaults to 640×480 which is 3.3× fewer pixels than
# 1280×720, drastically reducing decode/flip/convert/inference cost on the Pi.
# MediaPipe landmarks are normalized (0-1) so detection quality is unaffected.
FRAME_WIDTH = int(os.getenv("FRAME_WIDTH", "640"))
FRAME_HEIGHT = int(os.getenv("FRAME_HEIGHT", "480"))

# Whether to display the OpenCV preview window.
# Default to "true" for development; set to "false" in production (e.g. on
# a Raspberry Pi) to skip all GUI operations and improve performance.
default_preview = "false" if getattr(sys, "frozen", False) else "true"
SHOW_PREVIEW = os.getenv("SHOW_PREVIEW", default_preview).strip().lower() == "true"

MODEL_PATH = utils.getModel()

# ---------------------------------------------------------------------------
# MediaPipe Tasks API setup
# ---------------------------------------------------------------------------

BaseOptions = mp.tasks.BaseOptions
HandLandmarker = mp.tasks.vision.HandLandmarker
HandLandmarkerOptions = mp.tasks.vision.HandLandmarkerOptions
VisionRunningMode = mp.tasks.vision.RunningMode

options = HandLandmarkerOptions(
    base_options=BaseOptions(model_asset_path=MODEL_PATH),
    running_mode=VisionRunningMode.VIDEO,
    num_hands=2,
    min_hand_detection_confidence=0.75,
    min_tracking_confidence=0.5,
)

# ---------------------------------------------------------------------------
# Graceful shutdown flag (used in headless mode where cv2.waitKey is skipped)
# ---------------------------------------------------------------------------
_running = True


def _shutdown_handler(_signum, _frame):
    """Handle SIGINT/SIGTERM so the main loop exits cleanly in headless mode."""
    global _running  # noqa: PLW0603
    _running = False


signal.signal(signal.SIGINT, _shutdown_handler)
signal.signal(signal.SIGTERM, _shutdown_handler)


# ---------------------------------------------------------------------------
# Main loop
# ---------------------------------------------------------------------------
def main():
    """Entry point: open camera, detect hand gestures, and optionally display a preview."""
    cap = cv2.VideoCapture(CAMERA_INDEX, cv2.CAP_V4L2)
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, FRAME_WIDTH)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, FRAME_HEIGHT)

    # Check if the Camera is available
    if not cap.isOpened():
        print("ERROR: Could not open camera. Check CAMERA_INDEX.")
        return

    mode = "preview" if SHOW_PREVIEW else "headless"
    print(f"Starting camera in {mode} mode ({FRAME_WIDTH}×{FRAME_HEIGHT})...")

    if SHOW_PREVIEW:
        print("Controls:  q = quit  |  p = pause/resume terminal output")
    else:
        print("Running headless — send SIGINT (Ctrl+C) or SIGTERM to stop.")

    printing_enabled = True  # Toggle with 'p' (preview mode only).
    last_sign = "NONE"
    preview_supported = True

    # Pre-allocate a reusable buffer for the BGR→RGB conversion.
    # Avoids a fresh numpy allocation on every single frame (~1.2 MB at 640×480).
    rgb_buffer = np.empty((FRAME_HEIGHT, FRAME_WIDTH, 3), dtype=np.uint8)

    try:
        with HandLandmarker.create_from_options(options) as landmarker:
            failed_frames = 0
            while _running:
                ret, frame = cap.read()
                if not ret:
                    failed_frames += 1
                    if failed_frames > 30:
                        print("ERROR: Could not read frame after multiple attempts. Is the camera in use?")
                        break
                    time.sleep(0.1)
                    continue
                failed_frames = 0

                # Mirror the image so it feels natural.
                frame = cv2.flip(frame, 1)

                # Convert BGR -> RGB for MediaPipe, reusing the pre-allocated buffer.
                cv2.cvtColor(frame, cv2.COLOR_BGR2RGB, dst=rgb_buffer)
                mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_buffer)

                timestamp_ms = int(time.monotonic() * 1000)
                results = landmarker.detect_for_video(mp_image, timestamp_ms)

                if results.hand_landmarks:
                    current_sign = "NONE"
                    label = "PARTIAL"
                    color = (200, 200, 200)

                    # Check for two-hand gestures first (higher priority)
                    one_hand_gesture = detect_one_hand_gesture(results.hand_landmarks)
                    two_hand_gesture = detect_two_hand_gesture(results.hand_landmarks)

                    if two_hand_gesture:
                        current_sign, label, color = two_hand_gesture
                    elif one_hand_gesture:
                        current_sign, label, color = one_hand_gesture

                    if current_sign != last_sign and current_sign != "NONE":
                        send_to_server(current_sign)
                    last_sign = current_sign

                    if SHOW_PREVIEW:
                        cv2.putText(
                            frame,
                            label,
                            (30, 80),
                            cv2.FONT_HERSHEY_SIMPLEX,
                            1.5,
                            color,
                            3,
                        )

                        # Draw skeleton for all detected hands
                        for hand_landmarks in results.hand_landmarks:
                            utils.draw_skeleton(
                                frame, hand_landmarks, utils.HAND_CONNECTIONS
                            )
                elif SHOW_PREVIEW:
                    # No hand detected — show a hint (preview only).
                    cv2.putText(
                        frame,
                        "No hand detected",
                        (30, 50),
                        cv2.FONT_HERSHEY_SIMPLEX,
                        1,
                        (100, 100, 255),
                        2,
                        cv2.LINE_AA,
                    )

                if SHOW_PREVIEW and preview_supported:
                    try:
                        cv2.imshow("Hand Landmarks Debug", frame)
                        key = cv2.waitKey(5) & 0xFF
                        if key == ord("q"):
                            break
                        elif key == ord("p"):
                            printing_enabled = not printing_enabled
                            state = "ON" if printing_enabled else "OFF"
                            print(f"[Terminal output {state}]")
                    except cv2.error:
                        print("WARNING: OpenCV UI not supported (using opencv-python-headless). Switching to headless mode.")
                        preview_supported = False
                else:
                    # Small sleep to avoid busy-spinning in headless mode.
                    time.sleep(0.005)

    finally:
        cap.release()
        if SHOW_PREVIEW:
            try:
                cv2.destroyAllWindows()
            except cv2.error:
                pass
        print("Camera released. Goodbye.")


if __name__ == "__main__":
    main()
