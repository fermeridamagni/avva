"""Minimal diagnostic script to test camera + MediaPipe on the Pi.

Run with: libcamerify uv run src/debug_camera.py

This script reads 100 frames from the camera, runs MediaPipe hand detection,
and prints exactly what it sees — frame dimensions, number of hands detected,
finger states, and gesture classification.
"""

import os
import sys
import time

import cv2
import numpy as np

# Ensure DISPLAY is set for libcamera on headless Pi
if os.name == "posix" and "DISPLAY" not in os.environ:
    os.environ["DISPLAY"] = ":0"

import mediapipe as mp

import lib.utils as utils
from lib.gestures import compute_finger_states
from lib.helpers import detect_one_hand_gesture, detect_two_hand_gesture

MODEL_PATH = utils.getModel()

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

FRAME_WIDTH = 640
FRAME_HEIGHT = 480

print(f"Platform: {sys.platform}")
print(f"Requested resolution: {FRAME_WIDTH}x{FRAME_HEIGHT}")

if sys.platform == "linux":
    cap = cv2.VideoCapture(0, cv2.CAP_V4L2)
else:
    cap = cv2.VideoCapture(0)

cap.set(cv2.CAP_PROP_FRAME_WIDTH, FRAME_WIDTH)
cap.set(cv2.CAP_PROP_FRAME_HEIGHT, FRAME_HEIGHT)

if not cap.isOpened():
    print("ERROR: Could not open camera.")
    sys.exit(1)

# Read actual resolution
actual_w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
actual_h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
print(f"Actual camera resolution: {actual_w}x{actual_h}")

if actual_w != FRAME_WIDTH or actual_h != FRAME_HEIGHT:
    print(f"WARNING: Resolution mismatch! Requested {FRAME_WIDTH}x{FRAME_HEIGHT} but got {actual_w}x{actual_h}")
    FRAME_WIDTH = actual_w
    FRAME_HEIGHT = actual_h

rgb_buffer = np.empty((FRAME_HEIGHT, FRAME_WIDTH, 3), dtype=np.uint8)

print("\nReading 100 frames... Show your hand to the camera!\n")

frames_read = 0
frames_with_hands = 0
frames_with_gestures = 0

with HandLandmarker.create_from_options(options) as landmarker:
    for i in range(100):
        ret, frame = cap.read()
        if not ret:
            print(f"  Frame {i}: FAILED to read")
            time.sleep(0.1)
            continue

        frames_read += 1
        actual_shape = frame.shape
        frame = cv2.flip(frame, 1)

        # Resize if needed to match buffer
        if frame.shape[0] != FRAME_HEIGHT or frame.shape[1] != FRAME_WIDTH:
            frame = cv2.resize(frame, (FRAME_WIDTH, FRAME_HEIGHT))

        cv2.cvtColor(frame, cv2.COLOR_BGR2RGB, dst=rgb_buffer)
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_buffer)

        timestamp_ms = int(time.monotonic() * 1000)
        results = landmarker.detect_for_video(mp_image, timestamp_ms)

        if results.hand_landmarks:
            frames_with_hands += 1
            n_hands = len(results.hand_landmarks)

            one = detect_one_hand_gesture(results.hand_landmarks)
            two = detect_two_hand_gesture(results.hand_landmarks)

            gesture = two or one

            if gesture:
                frames_with_gestures += 1
                sign, label, _ = gesture
                print(f"  Frame {i}: {n_hands} hand(s) | GESTURE: {sign} ({label})")
            else:
                # Print finger states for debugging
                for hi, hand in enumerate(results.hand_landmarks):
                    states = compute_finger_states(hand)
                    state_str = " | ".join(f"{k}={'OPEN' if v else 'CLOSED'}" for k, v in states.items())
                    print(f"  Frame {i}: Hand {hi}: {state_str}  -> No gesture matched")
        else:
            if i % 20 == 0:
                print(f"  Frame {i}: No hands detected (frame shape: {actual_shape})")

        time.sleep(0.05)  # ~20 fps

cap.release()

print(f"\n--- Summary ---")
print(f"Frames read:          {frames_read}/100")
print(f"Frames with hands:    {frames_with_hands}")
print(f"Frames with gestures: {frames_with_gestures}")
