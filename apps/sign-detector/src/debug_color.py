"""Diagnostic: test whether libcamerify delivers BGR or RGB frames.

Saves a single frame as-is and with channels swapped so we can visually
inspect which one looks correct.

Run with: libcamerify uv run src/debug_color.py
"""

import os
import sys
import time

if os.name == "posix" and "DISPLAY" not in os.environ:
    os.environ["DISPLAY"] = ":0"

import cv2
import numpy as np

FRAME_WIDTH = 640
FRAME_HEIGHT = 480

if sys.platform == "linux":
    cap = cv2.VideoCapture(0, cv2.CAP_V4L2)
else:
    cap = cv2.VideoCapture(0)

cap.set(cv2.CAP_PROP_FRAME_WIDTH, FRAME_WIDTH)
cap.set(cv2.CAP_PROP_FRAME_HEIGHT, FRAME_HEIGHT)

if not cap.isOpened():
    print("ERROR: Could not open camera.")
    sys.exit(1)

actual_w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
actual_h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
print(f"Resolution: {actual_w}x{actual_h}")

# Skip initial failed frames (camera warmup)
for _ in range(20):
    ret, frame = cap.read()
    if ret:
        break
    time.sleep(0.1)

# Read a good frame
for attempt in range(30):
    ret, frame = cap.read()
    if ret:
        break
    time.sleep(0.1)

if not ret:
    print("ERROR: Could not read any frame")
    cap.release()
    sys.exit(1)

print(f"Frame shape: {frame.shape}, dtype: {frame.dtype}")

# Reshape if flat
if frame.ndim != 3:
    frame = frame.reshape((actual_h, actual_w, 3))
    print(f"Reshaped to: {frame.shape}")

# Print pixel values at center to check channel order
cy, cx = actual_h // 2, actual_w // 2
pixel = frame[cy, cx]
print(f"Center pixel (raw): B/R={pixel[0]}, G={pixel[1]}, R/B={pixel[2]}")

# Check fourcc
fourcc = int(cap.get(cv2.CAP_PROP_FOURCC))
fourcc_str = "".join([chr((fourcc >> 8 * i) & 0xFF) for i in range(4)])
print(f"FourCC: {fourcc_str} ({fourcc})")

# Check what cv2 reports as the format
print(f"CAP_PROP_FORMAT: {cap.get(cv2.CAP_PROP_FORMAT)}")
print(f"CAP_PROP_MODE: {cap.get(cv2.CAP_PROP_MODE)}")

# Save both versions
cv2.imwrite("/tmp/frame_as_bgr.png", frame)
swapped = cv2.cvtColor(frame, cv2.COLOR_RGB2BGR)
cv2.imwrite("/tmp/frame_swapped.png", swapped)
print("Saved /tmp/frame_as_bgr.png and /tmp/frame_swapped.png")

# Now test MediaPipe with both interpretations
import mediapipe as mp
import lib.utils as utils

MODEL_PATH = utils.getModel()

BaseOptions = mp.tasks.BaseOptions
HandLandmarker = mp.tasks.vision.HandLandmarker
HandLandmarkerOptions = mp.tasks.vision.HandLandmarkerOptions
VisionRunningMode = mp.tasks.vision.RunningMode

options = HandLandmarkerOptions(
    base_options=BaseOptions(model_asset_path=MODEL_PATH),
    running_mode=VisionRunningMode.IMAGE,
    num_hands=2,
    min_hand_detection_confidence=0.5,
    min_tracking_confidence=0.5,
)

with HandLandmarker.create_from_options(options) as landmarker:
    # Test 1: Treat frame as BGR (current behavior) -> convert to RGB
    rgb_from_bgr = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    mp_image1 = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_from_bgr)
    results1 = landmarker.detect(mp_image1)
    print(f"\nTest 1 (frame=BGR, convert BGR->RGB): {len(results1.hand_landmarks)} hands detected")

    # Test 2: Treat frame as already RGB -> pass directly
    mp_image2 = mp.Image(image_format=mp.ImageFormat.SRGB, data=np.ascontiguousarray(frame))
    results2 = landmarker.detect(mp_image2)
    print(f"Test 2 (frame=RGB, pass directly):    {len(results2.hand_landmarks)} hands detected")

    # Test 3: Frame as already RGB -> swap to get BGR -> convert BGR->RGB
    swapped_back = cv2.cvtColor(frame, cv2.COLOR_RGB2BGR)
    rgb_from_swapped = cv2.cvtColor(swapped_back, cv2.COLOR_BGR2RGB)
    mp_image3 = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_from_swapped)
    results3 = landmarker.detect(mp_image3)
    print(f"Test 3 (double swap check):            {len(results3.hand_landmarks)} hands detected")

cap.release()
print("\nDone!")
