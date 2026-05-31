import { useCallback, useRef } from "react";

/** Minimum horizontal distance (in pixels) to recognize a swipe. */
const SWIPE_THRESHOLD = 50;

/** Maximum vertical distance allowed before the gesture is considered a scroll. */
const VERTICAL_TOLERANCE = 80;

/** Maximum time (in milliseconds) for a gesture to count as a swipe. */
const MAX_SWIPE_DURATION = 500;

interface SwipeCallbacks {
  /** Called when the user swipes from right to left (navigate forward). */
  onSwipeLeft?: () => void;
  /** Called when the user swipes from left to right (navigate backward). */
  onSwipeRight?: () => void;
}

interface PointerState {
  startTime: number;
  startX: number;
  startY: number;
}

/**
 * Provides pointer event handlers for detecting horizontal swipe gestures.
 *
 * Works with both **touch** (Raspberry Pi touchscreen) and **mouse** (desktop
 * development). Uses Pointer Events which unify touch, mouse, and pen input.
 *
 * @example
 * ```tsx
 * const handlers = useSwipeGesture({
 *   onSwipeLeft: () => goToNextTab(),
 *   onSwipeRight: () => goToPreviousTab(),
 * });
 *
 * return <div {...handlers}>…</div>;
 * ```
 */
export function useSwipeGesture({ onSwipeLeft, onSwipeRight }: SwipeCallbacks) {
  const pointerState = useRef<PointerState | null>(null);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    pointerState.current = {
      startX: e.clientX,
      startY: e.clientY,
      startTime: Date.now(),
    };
  }, []);

  const evaluateSwipe = useCallback(
    (clientX: number, clientY: number) => {
      if (!pointerState.current) {
        return;
      }

      const deltaX = clientX - pointerState.current.startX;
      const deltaY = clientY - pointerState.current.startY;
      const elapsed = Date.now() - pointerState.current.startTime;

      pointerState.current = null;

      // Ignore if gesture took too long or was mostly vertical
      if (elapsed > MAX_SWIPE_DURATION) {
        return;
      }
      if (Math.abs(deltaY) > VERTICAL_TOLERANCE) {
        return;
      }
      if (Math.abs(deltaX) < SWIPE_THRESHOLD) {
        return;
      }

      if (deltaX < 0) {
        onSwipeLeft?.();
      } else {
        onSwipeRight?.();
      }
    },
    [onSwipeLeft, onSwipeRight]
  );

  const onPointerUp = useCallback(
    (e: React.PointerEvent) => evaluateSwipe(e.clientX, e.clientY),
    [evaluateSwipe]
  );

  const onPointerCancel = useCallback(() => {
    pointerState.current = null;
  }, []);

  return { onPointerCancel, onPointerDown, onPointerUp };
}
