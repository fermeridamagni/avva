import { useCallback, useEffect, useState } from "react";

/**
 * Options for the {@link useFormattedTime} hook.
 */
interface UseFormattedTimeOptions {
  /**
   * Update interval in milliseconds.
   * @default 1000 (1 second)
   */
  updateInterval?: number;
}

/**
 * Return type of the {@link useFormattedTime} hook.
 */
interface UseFormattedTimeReturn {
  /** The time formatted in 12-hour format (e.g., "02:30 PM"). */
  formattedTime: string;
  /** The IANA timezone identifier (e.g., "America/New_York"). */
  timezone: string;
  /** The abbreviated timezone name (e.g., "EST", "PDT"). */
  timezoneAbbr: string;
}

/**
 * Formats the current time string from a Date object using 12-hour format
 * for the given timezone.
 *
 * @param timezone - The IANA timezone string (e.g., "America/New_York").
 * @param date    - The Date object to format.
 * @returns The formatted time string (e.g., "02:30 PM").
 */
function formatTimeString(timezone: string, date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: timezone,
  }).format(date);
}

/**
 * Extracts the abbreviated timezone name (e.g., "EST", "PDT") for a given
 * timezone and Date object.
 *
 * @param timezone - The IANA timezone string.
 * @param date     - The Date object.
 * @returns The abbreviated timezone string, or an empty string if unavailable.
 */
function getTimezoneAbbreviation(timezone: string, date: Date): string {
  const parts = new Intl.DateTimeFormat("es-MX", {
    timeZoneName: "short",
    timeZone: timezone,
  }).formatToParts(date);

  return parts.find((part) => part.type === "timeZoneName")?.value ?? "";
}

/**
 * Hook that returns the current time formatted in 12-hour format along with the
 * user's timezone information. It uses the {@link Intl.DateTimeFormat} Web API
 * (available in the Tauri v2 webview) to detect the system timezone and format
 * the time accordingly.
 *
 * The hook updates on a configurable interval — by default every minute.
 *
 * @param options - Configuration options.
 * @param options.updateInterval - How often the time refreshes (ms). Defaults
 *   to 1000 (1 second).
 *
 * @example
 * ```tsx
 * const { formattedTime, timezone, timezoneAbbr } = useFormattedTime();
 * // formattedTime → "02:30 PM"
 * // timezone      → "America/New_York"
 * // timezoneAbbr  → "EST"
 * ```
 */
function useFormattedTime(
  options: UseFormattedTimeOptions = {}
): UseFormattedTimeReturn {
  const { updateInterval = 1000 } = options;

  /**
   * Resolves the current timezone and formats the time.
   */
  const getState = useCallback(() => {
    const now = new Date();
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const formattedTime = formatTimeString(timezone, now);
    const timezoneAbbr = getTimezoneAbbreviation(timezone, now);

    return { formattedTime, timezone, timezoneAbbr };
  }, []);

  const [state, setState] = useState(getState);

  useEffect(() => {
    const interval = setInterval(() => {
      setState(getState());
    }, updateInterval);

    return () => clearInterval(interval);
  }, [getState, updateInterval]);

  return state;
}

export {
  type UseFormattedTimeOptions,
  type UseFormattedTimeReturn,
  useFormattedTime,
};
