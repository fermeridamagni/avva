from lib.utils import distance


def is_hand_open(landmarks):
    """Return True if all 5 fingers are extended (open hand)."""
    wrist = landmarks[0]

    # Thumb: TIP (4) farther from wrist than IP (3)
    thumb_open = distance(landmarks[4], wrist) > distance(landmarks[3], wrist)
    # Index: TIP (8) farther from wrist than PIP (6)
    index_open = distance(landmarks[8], wrist) > distance(landmarks[6], wrist)
    # Middle: TIP (12) farther from wrist than PIP (10)
    middle_open = distance(landmarks[12], wrist) > distance(landmarks[10], wrist)
    # Ring: TIP (16) farther from wrist than PIP (14)
    ring_open = distance(landmarks[16], wrist) > distance(landmarks[14], wrist)
    # Pinky: TIP (20) farther from wrist than PIP (18)
    pinky_open = distance(landmarks[20], wrist) > distance(landmarks[18], wrist)

    return all([thumb_open, index_open, middle_open, ring_open, pinky_open])


def is_hand_closed(landmarks):
    """Return True if all fingers are curled in (closed hand)."""
    wrist = landmarks[0]

    # We ignore the thumb for the "closed hand" check because its tip (4)
    # often rests further from the wrist than its base joint (3) when folded.
    # Index: TIP (8) closer to wrist than PIP (6)
    index_closed = distance(landmarks[8], wrist) < distance(landmarks[6], wrist)
    # Middle: TIP (12) closer to wrist than PIP (10)
    middle_closed = distance(landmarks[12], wrist) < distance(landmarks[10], wrist)
    # Ring: TIP (16) closer to wrist than PIP (14)
    ring_closed = distance(landmarks[16], wrist) < distance(landmarks[14], wrist)
    # Pinky: TIP (20) closer to wrist than PIP (18)
    pinky_closed = distance(landmarks[20], wrist) < distance(landmarks[18], wrist)

    return all([index_closed, middle_closed, ring_closed, pinky_closed])


def is_thumb_open(landmarks):
    """Return True if the thumb finger is extended."""
    wrist = landmarks[0]

    # Thumb: TIP (4) farther from wrist than IP (3)
    thumb_open = distance(landmarks[4], wrist) > distance(landmarks[3], wrist)

    # Check that other fingers are not open (to distinguish from fully open hand)
    index_open = distance(landmarks[8], wrist) > distance(landmarks[6], wrist)
    middle_open = distance(landmarks[12], wrist) > distance(landmarks[10], wrist)
    ring_open = distance(landmarks[16], wrist) > distance(landmarks[14], wrist)
    pinky_open = distance(landmarks[20], wrist) > distance(landmarks[18], wrist)

    return (
        thumb_open
        and not index_open
        and not middle_open
        and not ring_open
        and not pinky_open
    )


def is_index_open(landmarks):
    """Return True if the index finger is extended."""
    wrist = landmarks[0]

    # Index: TIP (8) farther from wrist than PIP (6)
    index_open = distance(landmarks[8], wrist) > distance(landmarks[6], wrist)

    # Check that other fingers are not open (to distinguish from fully open hand)
    thumb_open = distance(landmarks[4], wrist) > distance(landmarks[3], wrist)
    middle_open = distance(landmarks[12], wrist) > distance(landmarks[10], wrist)
    ring_open = distance(landmarks[16], wrist) > distance(landmarks[14], wrist)
    pinky_open = distance(landmarks[20], wrist) > distance(landmarks[18], wrist)

    return (
        index_open
        and not thumb_open
        and not middle_open
        and not ring_open
        and not pinky_open
    )


def is_middle_open(landmarks):
    """Return True if the middle finger is extended."""
    wrist = landmarks[0]

    # Middle: TIP (12) farther from wrist than PIP (10)
    middle_open = distance(landmarks[12], wrist) > distance(landmarks[10], wrist)

    # Check that other fingers are not open (to distinguish from fully open hand)
    thumb_open = distance(landmarks[4], wrist) > distance(landmarks[3], wrist)
    index_open = distance(landmarks[8], wrist) > distance(landmarks[6], wrist)
    ring_open = distance(landmarks[16], wrist) > distance(landmarks[14], wrist)
    pinky_open = distance(landmarks[20], wrist) > distance(landmarks[18], wrist)

    return (
        middle_open
        and not thumb_open
        and not index_open
        and not ring_open
        and not pinky_open
    )


def is_ring_open(landmarks):
    """Return True if the ring finger is extended."""
    wrist = landmarks[0]

    # Ring: TIP (16) farther from wrist than PIP (14)
    ring_open = distance(landmarks[16], wrist) > distance(landmarks[14], wrist)

    # Check that other fingers are not open (to distinguish from fully open hand)
    thumb_open = distance(landmarks[4], wrist) > distance(landmarks[3], wrist)
    index_open = distance(landmarks[8], wrist) > distance(landmarks[6], wrist)
    middle_open = distance(landmarks[12], wrist) > distance(landmarks[10], wrist)
    pinky_open = distance(landmarks[20], wrist) > distance(landmarks[18], wrist)

    return (
        ring_open
        and not thumb_open
        and not index_open
        and not middle_open
        and not pinky_open
    )


def is_pinky_open(landmarks):
    """Return True if the pinky finger is extended."""
    wrist = landmarks[0]

    # Pinky: TIP (20) farther from wrist than PIP (18)
    pinky_open = distance(landmarks[20], wrist) > distance(landmarks[18], wrist)

    # Check that other fingers are not open (to distinguish from fully open hand)
    thumb_open = distance(landmarks[4], wrist) > distance(landmarks[3], wrist)
    index_open = distance(landmarks[8], wrist) > distance(landmarks[6], wrist)
    middle_open = distance(landmarks[12], wrist) > distance(landmarks[10], wrist)
    ring_open = distance(landmarks[16], wrist) > distance(landmarks[14], wrist)

    return (
        pinky_open
        and not thumb_open
        and not index_open
        and not middle_open
        and not ring_open
    )
