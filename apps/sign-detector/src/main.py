import os
import time
import cv2
import mediapipe as mp
from dotenv import load_dotenv

load_dotenv()  # Load environment variables before importing modules that read them.

import lib.utils as utils
import lib.helpers as helpers
import lib.handlers as handlers

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

# Camera index.  0 is usually the built-in FaceTime HD camera on macOS.
# If an iPhone is acting as a Continuity Camera, try index 1.
CAMERA_INDEX = int(os.getenv("CAMERA_INDEX", "0"))


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
                    two_hand_gesture = helpers.detect_two_hand_gesture(
                        results.hand_landmarks)

                    if two_hand_gesture:
                        current_sign, label, color = two_hand_gesture
                    else:
                        # Fall back to single-hand gestures (use first detected hand)
                        landmarks = results.hand_landmarks[0]

                        if helpers.is_hand_open(landmarks):
                            current_sign = "ALL_ON"
                            label = "Turn All ON (Open Hand)"
                            color = (0, 255, 255)
                        elif helpers.is_hand_closed(landmarks):
                            current_sign = "ALL_OFF"
                            label = "Turn All OFF (Fist)"
                            color = (0, 0, 255)
                        elif helpers.is_thumb_open(landmarks):
                            current_sign = "LIGHTS_TOGGLE"
                            label = "Power On/Off lights"
                            color = (0, 255, 0)
                        elif helpers.is_middle_and_index_open(landmarks):
                            current_sign = "FAN_TOGGLE"
                            label = "Power On/Off Fan"
                            color = (255, 0, 0)
                        elif helpers.is_pinky_open(landmarks):
                            current_sign = "DEVICE_3"
                            label = "Toggle Device 3 (Pinky)"
                            color = (255, 0, 255)

                    if current_sign != last_sign and current_sign != "NONE":
                        handlers.send_to_server(current_sign)
                    last_sign = current_sign

                    cv2.putText(frame, label, (30, 80),
                                cv2.FONT_HERSHEY_SIMPLEX, 1.5, color, 3)

                    # Draw skeleton for all detected hands
                    for hand_landmarks in results.hand_landmarks:
                        utils.draw_skeleton(
                            frame, hand_landmarks, utils.HAND_CONNECTIONS)
                else:
                    # No hand detected - show a hint.
                    cv2.putText(frame, "No hand detected", (30, 50),
                                cv2.FONT_HERSHEY_SIMPLEX, 1, (100,
                                                              100, 255), 2,
                                cv2.LINE_AA)

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
