from lib.gestures import (
    compute_finger_states,
    is_hand_closed,
    is_hand_open,
    is_index_and_middle_open,
    is_index_open,
)


def detect_one_hand_gesture(landmarks_list):
    """Detect single-hand gestures based on landmarks.

    Pre-computes finger states once and passes the result to each
    gesture checker, avoiding redundant distance calculations.
    """

    # We can only detect one-hand gestures if we have exactly 1 hand.
    if len(landmarks_list) != 1:
        return None

    landmarks = landmarks_list[0]
    states = compute_finger_states(landmarks)

    if is_hand_closed(states):
        return ("TOOGLE_LIGHT", "Turn ON/OFF current Light", (0, 255, 128))
    elif is_index_and_middle_open(states):
        return ("TOGGLE_TV", "Turn ON/OFF TV", (0, 255, 128))

    return None


def detect_two_hand_gesture(landmarks_list):
    """Detect two-hand gestures based on landmarks from both hands.

    Pre-computes finger states for each hand once and reuses them
    across all two-hand gesture checks.
    """

    # If we don't have exactly 2 hands, we can't detect two-hand gestures.
    if len(landmarks_list) != 2:
        return None

    hand1, hand2 = landmarks_list[0], landmarks_list[1]
    states1 = compute_finger_states(hand1)
    states2 = compute_finger_states(hand2)

    # Check for: one hand open + other hand index only = Toggle Fan 1
    # Check for: one hand open + other hand index+middle = Toggle Fan 2
    hand1_open = is_hand_open(states1)
    hand1_index = is_index_open(states1)
    hand1_index_and_middle = is_index_and_middle_open(states1)

    hand2_open = is_hand_open(states2)
    hand2_index = is_index_open(states2)
    hand2_index_and_middle = is_index_and_middle_open(states2)

    if (hand1_open and hand2_index) or (hand2_open and hand1_index):
        return ("TOGGLE_FAN_1", "Toggle Fan 1", (0, 255, 128))
    elif (hand1_open and hand2_index_and_middle) or (
        hand2_open and hand1_index_and_middle
    ):
        return ("TOGGLE_FAN_2", "Toggle Fan 2", (0, 255, 128))

    return None
