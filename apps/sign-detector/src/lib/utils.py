import math
import cv2

# Colors (BGR format for OpenCV).
COLOR_BONE = (0, 255, 0)        # Green lines between joints.
COLOR_JOINT = (0, 0, 255)       # Red circles at each joint.
COLOR_LABEL = (255, 255, 255)   # White text for landmark labels.
COLOR_COORD = (0, 255, 255)     # Yellow text for the coordinate panel.

# Skeleton connections (pairs of landmark indices that should be joined by a
# line).  These follow the standard MediaPipe hand topology.
HAND_CONNECTIONS: list[tuple[int, int]] = [
    # Thumb
    (0, 1), (1, 2), (2, 3), (3, 4),
    # Index finger
    (0, 5), (5, 6), (6, 7), (7, 8),
    # Middle finger
    (5, 9), (9, 10), (10, 11), (11, 12),
    # Ring finger
    (9, 13), (13, 14), (14, 15), (15, 16),
    # Pinky
    (13, 17), (0, 17), (17, 18), (18, 19), (19, 20),
]

# Human-readable landmark names, indexed 0-20.
LANDMARK_NAMES: list[str] = [
    "WRIST",
    "THUMB_CMC",
    "THUMB_MCP",
    "THUMB_IP",
    "THUMB_TIP",
    "INDEX_FINGER_MCP",
    "INDEX_FINGER_PIP",
    "INDEX_FINGER_DIP",
    "INDEX_FINGER_TIP",
    "MIDDLE_FINGER_MCP",
    "MIDDLE_FINGER_PIP",
    "MIDDLE_FINGER_DIP",
    "MIDDLE_FINGER_TIP",
    "RING_FINGER_MCP",
    "RING_FINGER_PIP",
    "RING_FINGER_DIP",
    "RING_FINGER_TIP",
    "PINKY_MCP",
    "PINKY_PIP",
    "PINKY_DIP",
    "PINKY_TIP",
]

def distance(a, b):
    """Euclidean distance between two landmarks (using x, y)."""
    return math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2)

# ---------------------------------------------------------------------------
# Drawing helpers
# ---------------------------------------------------------------------------
def draw_skeleton(frame, landmarks, connections):
    """Draw the hand skeleton (bones + joints) onto *frame*.

    Parameters
    ----------
    frame : numpy.ndarray
        The BGR image to draw on (modified in place).
    landmarks : list
        List of 21 ``NormalizedLandmark`` objects from MediaPipe.
    connections : list[tuple[int, int]]
        Pairs of landmark indices to connect with lines.
    """
    h, w, _ = frame.shape
    pixel_coords = [(int(lm.x * w), int(lm.y * h)) for lm in landmarks]

    # Draw bones (lines).
    for start_idx, end_idx in connections:
        cv2.line(frame, pixel_coords[start_idx], pixel_coords[end_idx],
                 COLOR_BONE, 2)

    # Draw joints (circles) and index numbers.
    for idx, (px, py) in enumerate(pixel_coords):
        cv2.circle(frame, (px, py), 6, COLOR_JOINT, -1)
        # Place the landmark index slightly above-right of the dot.
        cv2.putText(frame, str(idx), (px + 8, py - 8),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.4, COLOR_LABEL, 1,
                    cv2.LINE_AA)
        

def draw_coordinate_panel(frame, landmarks):
    """Render a translucent overlay on the left side showing all coordinates.

    Each line shows:  ``<index> <NAME> x=... y=... z=...``

    Parameters
    ----------
    frame : numpy.ndarray
        The BGR image to draw on (modified in place).
    landmarks : list
        List of 21 ``NormalizedLandmark`` objects from MediaPipe.
    """
    # Semi-transparent dark rectangle as background for readability.
    overlay = frame.copy()
    panel_w = 420
    panel_h = 21 * 22 + 30  # 21 landmarks * 22 px line height + padding
    cv2.rectangle(overlay, (0, 0), (panel_w, panel_h), (0, 0, 0), -1)
    cv2.addWeighted(overlay, 0.55, frame, 0.45, 0, frame)

    # Title
    cv2.putText(frame, "Landmark Coordinates (normalized)", (8, 18),
                cv2.FONT_HERSHEY_SIMPLEX, 0.5, COLOR_COORD, 1, cv2.LINE_AA)

    # One line per landmark.
    for idx, lm in enumerate(landmarks):
        text = f"{idx:2d} {LANDMARK_NAMES[idx]:<20s} x={lm.x:.3f} y={lm.y:.3f} z={lm.z:.3f}"
        y_pos = 40 + idx * 22
        cv2.putText(frame, text, (8, y_pos),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.38, COLOR_COORD, 1,
                    cv2.LINE_AA)
        

# ---------------------------------------------------------------------------
# Printing helpers
# ---------------------------------------------------------------------------
def print_coordinates_table(landmarks):
    """Print a formatted table of all landmark coordinates to the terminal.

    Parameters
    ----------
    landmarks : list
        List of 21 ``NormalizedLandmark`` objects from MediaPipe.
    """
    header = f"{'ID':>3s}  {'Name':<22s}  {'x':>8s}  {'y':>8s}  {'z':>8s}"
    separator = "-" * len(header)
    print(f"\n{separator}")
    print(header)
    print(separator)
    for idx, lm in enumerate(landmarks):
        print(f"{idx:3d}  {LANDMARK_NAMES[idx]:<22s}  {lm.x:8.4f}  {lm.y:8.4f}  {lm.z:8.4f}")
    print(separator)