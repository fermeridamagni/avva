from lib.utils import distance_sq


def compute_finger_states(landmarks) -> dict[str, bool]:
    """Compute all finger open/closed states in a single pass.

    Pre-computes every finger's extension state once, eliminating the
    redundant ~60-70 distance_sq() calls that happened when each
    is_*_open / is_*_closed function was invoked independently.

    Returns a dict with keys: thumb, index, middle, ring, pinky.
    Each value is True if the finger is extended (tip farther from
    wrist than the reference joint).
    """
    wrist = landmarks[0]
    return {
        "thumb": distance_sq(landmarks[4], wrist) > distance_sq(landmarks[3], wrist),
        "index": distance_sq(landmarks[8], wrist) > distance_sq(landmarks[6], wrist),
        "middle": distance_sq(landmarks[12], wrist) > distance_sq(landmarks[10], wrist),
        "ring": distance_sq(landmarks[16], wrist) > distance_sq(landmarks[14], wrist),
        "pinky": distance_sq(landmarks[20], wrist) > distance_sq(landmarks[18], wrist),
    }


def is_hand_open(states: dict[str, bool]) -> bool:
    """Return True if all 5 fingers are extended (open hand)."""
    return all(states.values())


def is_hand_closed(states: dict[str, bool]) -> bool:
    """Return True if all fingers are curled in (closed hand).

    Ignores the thumb because its tip (4) often rests farther from the
    wrist than its base joint (3) even when folded.
    """
    return (
        not states["index"]
        and not states["middle"]
        and not states["ring"]
        and not states["pinky"]
    )


def is_thumb_open(states: dict[str, bool]) -> bool:
    """Return True if only the thumb is extended."""
    return (
        states["thumb"]
        and not states["index"]
        and not states["middle"]
        and not states["ring"]
        and not states["pinky"]
    )


def is_index_open(states: dict[str, bool]) -> bool:
    """Return True if only the index finger is extended."""
    return (
        states["index"]
        and not states["middle"]
        and not states["ring"]
        and not states["pinky"]
    )


def is_middle_open(states: dict[str, bool]) -> bool:
    """Return True if only the middle finger is extended."""
    return (
        states["middle"]
        and not states["index"]
        and not states["ring"]
        and not states["pinky"]
    )


def is_ring_open(states: dict[str, bool]) -> bool:
    """Return True if only the ring finger is extended."""
    return (
        states["ring"]
        and not states["index"]
        and not states["middle"]
        and not states["pinky"]
    )


def is_pinky_open(states: dict[str, bool]) -> bool:
    """Return True if only the pinky finger is extended."""
    return (
        states["pinky"]
        and not states["index"]
        and not states["middle"]
        and not states["ring"]
    )
