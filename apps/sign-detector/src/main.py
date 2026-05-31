import os
import time
import mediapipe as mp
import cv2
from dotenv import load_dotenv
import lib.utils as utils
from lib.helpers import detect_one_hand_gesture, detect_two_hand_gesture
from lib.handlers import send_to_server

load_dotenv()  # Load environment variables before importing modules that read them.

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
    min_hand_detection_confidence=0.7,
    min_tracking_confidence=0.5,
)


# ---------------------------------------------------------------------------
# Main loop
# ---------------------------------------------------------------------------
def main():
    """Entry point: open camera, detect hand, display landmarks and coords."""
    cap = cv2.VideoCapture(CAMERA_INDEX)
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)

    # Check if the Camera is available
    if not cap.isOpened():
        print("ERROR: Could not open camera. Check CAMERA_INDEX.")
        return

    print("Starting camera...")
    print("Controls:  q = quit  |  p = pause/resume terminal output")

    printing_enabled = True  # Toggle with 'p'.
    last_sign = "NONE"

    try:
        with HandLandmarker.create_from_options(options) as landmarker:
            while True:
                ret, frame = cap.read()
                if not ret:
                    print("ERROR: Could not read frame. Is the camera in use?")
                    break

                # Mirror the image so it feels natural.
                frame = cv2.flip(frame, 1)

                # Convert BGR -> RGB for MediaPipe.
                rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)

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

                    cv2.putText(
                        frame, label, (30, 80), cv2.FONT_HERSHEY_SIMPLEX, 1.5, color, 3
                    )

                    # Draw skeleton for all detected hands
                    for hand_landmarks in results.hand_landmarks:
                        utils.draw_skeleton(
                            frame, hand_landmarks, utils.HAND_CONNECTIONS
                        )
                else:
                    # No hand detected - show a hint.
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

                cv2.imshow("Hand Landmarks Debug", frame)

                key = cv2.waitKey(5) & 0xFF
                if key == ord("q"):
                    break
                elif key == ord("p"):
                    printing_enabled = not printing_enabled
                    state = "ON" if printing_enabled else "OFF"
                    print(f"[Terminal output {state}]")

    finally:
        cap.release()
        cv2.destroyAllWindows()
        print("Camera released. Goodbye.")


if __name__ == "__main__":
    main()
