from lib.gestures import (
    is_hand_closed,
    is_hand_open,
    is_thumb_open,
    is_index_open,
    is_middle_open,
    is_ring_open,
    is_pinky_open,
)


def detect_one_hand_gesture(landmarks_list):
    """Detect single-hand gestures based on landmarks."""

    # We can only detect one-hand gestures if we have exactly 1 hand.
    if len(landmarks_list) != 1:
        return None

    landmarks = landmarks_list[0]

    if is_hand_closed(landmarks):
        return ("TOOGLE_LIGHT", "Turn ON/OFF current Light", (0, 255, 128))
    elif is_index_open(landmarks):
        return ("TOGGLE_ALARM", "Turn ON/OFF current Alarm", (0, 255, 128))
    elif is_middle_open(landmarks):
        return ("TOGGLE_FAN", "Fuck you Cesar", (0, 255, 128))

    return None


def detect_two_hand_gesture(landmarks_list):
    """Detect two-hand gestures based on landmarks from both hands."""

    # If we don't have exactly 2 hands, we can't detect two-hand gestures.
    if len(landmarks_list) != 2:
        return None

    hand1, hand2 = landmarks_list[0], landmarks_list[1]

    # Check for: one hand open + other hand index only = LIGHT_ONE
    hand1_open = is_hand_open(hand1)
    hand1_index = is_index_open(hand1)
    hand1_middle = is_middle_open(hand1)

    hand2_open = is_hand_open(hand2)
    hand2_index = is_index_open(hand2)
    hand2_middle = is_middle_open(hand2)

    if (hand1_open and hand2_index) or (hand2_open and hand1_index):
        return ("TOGGLE_LIGHT_ONE", "Light 1 ON (Open + Index)", (0, 255, 128))
    elif hand1_middle and hand2_middle:
        return ("X", "Fuck you Cesar al cuadrado", (0, 255, 128))

    return None
