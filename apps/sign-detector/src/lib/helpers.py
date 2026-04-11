from lib import utils
distance = utils.distance


def is_hand_open(landmarks):
    """Return True if all 5 fingers are extended (open hand)."""
    wrist = landmarks[0]

    # Thumb: TIP (4) farther from wrist than IP (3)
    thumb_open = distance(landmarks[4], wrist) > distance(landmarks[3], wrist)
    # Index: TIP (8) farther from wrist than PIP (6)
    index_open = distance(landmarks[8], wrist) > distance(landmarks[6], wrist)
    # Middle: TIP (12) farther from wrist than PIP (10)
    middle_open = distance(landmarks[12], wrist) > distance(
        landmarks[10], wrist)
    # Ring: TIP (16) farther from wrist than PIP (14)
    ring_open = distance(landmarks[16], wrist) > distance(landmarks[14], wrist)
    # Pinky: TIP (20) farther from wrist than PIP (18)
    pinky_open = distance(landmarks[20], wrist) > distance(
        landmarks[18], wrist)

    return all([thumb_open, index_open, middle_open, ring_open, pinky_open])


def is_hand_closed(landmarks):
    """Return True if all 5 fingers are curled (fist)."""
    wrist = landmarks[0]

    # Thumb: TIP (4) closer to wrist than IP (3)
    thumb_closed = distance(
        landmarks[4], wrist) < distance(landmarks[3], wrist)
    # Index: TIP (8) closer to wrist than PIP (6)
    index_closed = distance(
        landmarks[8], wrist) < distance(landmarks[6], wrist)
    # Middle: TIP (12) closer to wrist than PIP (10)
    middle_closed = distance(
        landmarks[12], wrist) < distance(landmarks[10], wrist)
    # Ring: TIP (16) closer to wrist than PIP (14)
    ring_closed = distance(landmarks[16], wrist) < distance(
        landmarks[14], wrist)
    # Pinky: TIP (20) closer to wrist than PIP (18)
    pinky_closed = distance(landmarks[20], wrist) < distance(
        landmarks[18], wrist)

    return all([thumb_closed, index_closed, middle_closed, ring_closed, pinky_closed])


def is_middle_open(landmarks):
    """Return True if the middle finger is extended (open)."""
    wrist = landmarks[0]

    # Thumb: TIP (4) closer to wrist than IP (3)
    thumb_closed = distance(
        landmarks[4], wrist) < distance(landmarks[3], wrist)
    # Index: TIP (8) closer to wrist than PIP (6)
    index_closed = distance(
        landmarks[8], wrist) < distance(landmarks[6], wrist)
    # Middle: TIP (12) farther from wrist than PIP (10)
    middle_open = distance(landmarks[12], wrist) > distance(
        landmarks[10], wrist)
    # Ring: TIP (16) closer to wrist than PIP (14)
    ring_closed = distance(landmarks[16], wrist) < distance(
        landmarks[14], wrist)
    # Pinky: TIP (20) closer to wrist than PIP (18)
    pinky_closed = distance(landmarks[20], wrist) < distance(
        landmarks[18], wrist)

    return all([thumb_closed, index_closed, middle_open, ring_closed, pinky_closed])


def is_middle_and_index_open(landmarks):
    """Return True if the middle and index fingers are extended (open)."""
    wrist = landmarks[0]

    # Thumb: TIP (4) closer to wrist than IP (3)
    thumb_closed = distance(
        landmarks[4], wrist) < distance(landmarks[3], wrist)
    # Index: TIP (8) farther from wrist than PIP (6)
    index_open = distance(landmarks[8], wrist) > distance(landmarks[6], wrist)
    # Middle: TIP (12) farther from wrist than PIP (10)
    middle_open = distance(landmarks[12], wrist) > distance(
        landmarks[10], wrist)
    # Ring: TIP (16) closer to wrist than PIP (14)
    ring_closed = distance(landmarks[16], wrist) < distance(
        landmarks[14], wrist)
    # Pinky: TIP (20) closer to wrist than PIP (18)
    pinky_closed = distance(landmarks[20], wrist) < distance(
        landmarks[18], wrist)

    return all([thumb_closed, index_open, middle_open, ring_closed, pinky_closed])


def is_pinky_open(landmarks):
    """Return True if only the pinky is extended."""
    from lib import utils
    distance = utils.distance
    wrist = landmarks[0]

    # Thumb: TIP (4) closer to wrist than IP (3)
    thumb_closed = distance(
        landmarks[4], wrist) < distance(landmarks[3], wrist)
    # Index: TIP (8) closer to wrist than PIP (6)
    index_closed = distance(
        landmarks[8], wrist) < distance(landmarks[6], wrist)
    # Middle: TIP (12) closer to wrist than PIP (10)
    middle_closed = distance(
        landmarks[12], wrist) < distance(landmarks[10], wrist)
    # Ring: TIP (16) closer to wrist than PIP (14)
    ring_closed = distance(landmarks[16], wrist) < distance(
        landmarks[14], wrist)
    # Pinky: TIP (20) farther from wrist than PIP (18)
    pinky_open = distance(landmarks[20], wrist) > distance(
        landmarks[18], wrist)

    return all([thumb_closed, index_closed, middle_closed, ring_closed, pinky_open])


def is_thumb_open(landmarks):
    """Return True if the thumb finger is curled."""
    wrist = landmarks[0]

    # Thumb: TIP (4) farther from wrist than IP (3)
    thumb_open = distance(landmarks[4], wrist) > distance(landmarks[6], wrist)
    # Index: TIP (8) closer to wrist than PIP (6)
    index_closed = distance(
        landmarks[8], wrist) < distance(landmarks[6], wrist)
    # Middle: TIP (12) closer to wrist than PIP (10)
    middle_closed = distance(
        landmarks[12], wrist) < distance(landmarks[10], wrist)
    # Ring: TIP (16) closer to wrist than PIP (14)
    ring_closed = distance(landmarks[16], wrist) < distance(
        landmarks[14], wrist)
    # Pinky: TIP (20) closer to wrist than PIP (18)
    pinky_closed = distance(landmarks[20], wrist) < distance(
        landmarks[18], wrist)

    return all([thumb_open, index_closed, middle_closed, ring_closed, pinky_closed])


def is_index_only_open(landmarks):
    """Return True if only the index finger is extended (pointing gesture)."""
    wrist = landmarks[0]

    # Thumb: TIP (4) closer to wrist than IP (3)
    thumb_closed = distance(
        landmarks[4], wrist) < distance(landmarks[3], wrist)
    # Index: TIP (8) farther from wrist than PIP (6)
    index_open = distance(landmarks[8], wrist) > distance(landmarks[6], wrist)
    # Middle: TIP (12) closer to wrist than PIP (10)
    middle_closed = distance(
        landmarks[12], wrist) < distance(landmarks[10], wrist)
    # Ring: TIP (16) closer to wrist than PIP (14)
    ring_closed = distance(landmarks[16], wrist) < distance(
        landmarks[14], wrist)
    # Pinky: TIP (20) closer to wrist than PIP (18)
    pinky_closed = distance(landmarks[20], wrist) < distance(
        landmarks[18], wrist)

    return all([thumb_closed, index_open, middle_closed, ring_closed, pinky_closed])


def detect_two_hand_gesture(landmarks_list):
    """
    Detect gestures that require two hands.

    Args:
        landmarks_list: List of hand landmarks (should have 2 hands)

    Returns:
        Tuple of (gesture_name, label, color) or None if no two-hand gesture detected
    """
    if len(landmarks_list) != 2:
        return None

    hand1, hand2 = landmarks_list[0], landmarks_list[1]

    # Check for: one hand open + other hand index only = LIGHT_ONE
    hand1_open = is_hand_open(hand1)
    hand1_index = is_index_only_open(hand1)
    hand2_open = is_hand_open(hand2)
    hand2_index = is_index_only_open(hand2)

    if (hand1_open and hand2_index) or (hand2_open and hand1_index):
        return ("LIGHT_ONE", "Light 1 ON (Open + Index)", (0, 255, 128))

    return None
