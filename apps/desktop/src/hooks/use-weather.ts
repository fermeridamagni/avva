import { useCallback, useEffect, useState } from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * WMO weather interpretation codes as defined by the World Meteorological
 * Organization. These are returned by the Open-Meteo API.
 *
 * @see https://open-meteo.com/en/docs#weathervariables
 */
type WmoCode =
  | 0 // Clear sky
  | 1 // Mainly clear
  | 2 // Partly cloudy
  | 3 // Overcast
  | 45 // Fog
  | 48 // Depositing rime fog
  | 51 // Light drizzle
  | 53 // Moderate drizzle
  | 55 // Dense drizzle
  | 56 // Light freezing drizzle
  | 57 // Dense freezing drizzle
  | 61 // Slight rain
  | 63 // Moderate rain
  | 65 // Heavy rain
  | 66 // Light freezing rain
  | 67 // Heavy freezing rain
  | 71 // Slight snow fall
  | 73 // Moderate snow fall
  | 75 // Heavy snow fall
  | 77 // Snow grains
  | 80 // Slight rain showers
  | 81 // Moderate rain showers
  | 82 // Violent rain showers
  | 85 // Slight snow showers
  | 86 // Heavy snow showers
  | 95 // Thunderstorm
  | 96 // Thunderstorm with slight hail
  | 99; // Thunderstorm with heavy hail

/**
 * Open-Meteo current weather API response shape (relevant fields only).
 */
interface OpenMeteoCurrentWeatherResponse {
  current_weather: {
    temperature: number;
    weathercode: WmoCode;
    time: string;
  };
}

/**
 * Structured weather data returned by the {@link useWeather} hook.
 */
interface WeatherData {
  /** Human-readable weather condition (e.g. "Partly cloudy"). */
  condition: string;
  /** Emoji representing the current weather condition. */
  emoji: string;
  /** Temperature in degrees Celsius. */
  temperature: number;
  /** The original WMO weather code. */
  wmoCode: WmoCode;
}

/**
 * Options for the {@link useWeather} hook.
 */
interface UseWeatherOptions {
  /**
   * How often the weather should be refreshed (in milliseconds).
   * @default 1_800_000 (30 minutes)
   */
  updateInterval?: number;
}

/**
 * Return type of the {@link useWeather} hook.
 */
interface UseWeatherReturn {
  /** An error message if the fetch failed, or `null`. */
  error: string | null;
  /** Whether the initial fetch is in progress. */
  isLoading: boolean;
  /** The current weather data, or `null` if not yet fetched / unavailable. */
  weather: WeatherData | null;
}

// ---------------------------------------------------------------------------
// WMO → condition / emoji mapping
// ---------------------------------------------------------------------------

/**
 * Map of WMO weather codes to their human-readable descriptions.
 */
const WMO_CONDITIONS: Record<number, string> = {
  0: "Clear sky",
  1: "Mainly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Fog",
  48: "Rime fog",
  51: "Light drizzle",
  53: "Moderate drizzle",
  55: "Dense drizzle",
  56: "Freezing drizzle",
  57: "Dense freezing drizzle",
  61: "Slight rain",
  63: "Moderate rain",
  65: "Heavy rain",
  66: "Light freezing rain",
  67: "Heavy freezing rain",
  71: "Slight snow",
  73: "Moderate snow",
  75: "Heavy snow",
  77: "Snow grains",
  80: "Slight rain showers",
  81: "Moderate rain showers",
  82: "Violent rain showers",
  85: "Slight snow showers",
  86: "Heavy snow showers",
  95: "Thunderstorm",
  96: "Thunderstorm with hail",
  99: "Thunderstorm with heavy hail",
};

/**
 * Map of WMO weather codes to representative emoji.
 */
const WMO_EMOJI: Record<number, string> = {
  0: "☀️",
  1: "🌤️",
  2: "⛅",
  3: "☁️",
  45: "🌫️",
  48: "🌫️",
  51: "🌦️",
  53: "🌦️",
  55: "🌧️",
  56: "🌧️",
  57: "🌧️",
  61: "🌧️",
  63: "🌧️",
  65: "🌧️",
  66: "🌧️",
  67: "🌧️",
  71: "🌨️",
  73: "🌨️",
  75: "❄️",
  77: "🌨️",
  80: "🌦️",
  81: "🌧️",
  82: "⛈️",
  85: "🌨️",
  86: "❄️",
  95: "⛈️",
  96: "⛈️",
  99: "⛈️",
};

// ---------------------------------------------------------------------------
// Cache keys & helpers
// ---------------------------------------------------------------------------

const POSITION_CACHE_KEY = "avva_position";
const WEATHER_CACHE_KEY = "avva_weather";

/** How long a cached position is considered fresh (24 hours). */
const POSITION_CACHE_TTL = 86_400_000;

interface CachedPosition {
  latitude: number;
  longitude: number;
  timestamp: number;
}

interface CachedWeather {
  data: WeatherData;
  timestamp: number;
}

/**
 * Reads a JSON value from localStorage, returning `null` if the key doesn't
 * exist or parsing fails.
 */
function readCache<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);

    if (!raw) {
      return null;
    }

    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

/**
 * Writes a JSON-serialisable value to localStorage. Silently ignores
 * failures (e.g. quota exceeded).
 */
function writeCache<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage errors — cache is best-effort.
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Tries to resolve the user's position via the browser Geolocation API.
 *
 * @returns An object with `latitude` and `longitude`, or `null` if
 *   geolocation is unavailable, denied, or times out.
 */
function getBrowserPosition(): Promise<{
  latitude: number;
  longitude: number;
} | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) =>
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }),
      () => resolve(null),
      {
        enableHighAccuracy: false,
        timeout: 10_000,
        maximumAge: 600_000,
      }
    );
  });
}

/**
 * Resolves the user's approximate position via IP-based geolocation
 * (ipapi.co). This works without any browser permissions and is used as
 * a fallback when the native Geolocation API is unavailable (e.g. in
 * Tauri's WKWebView on macOS).
 *
 * @returns An object with `latitude` and `longitude`, or `null` on failure.
 */
async function getIpPosition(): Promise<{
  latitude: number;
  longitude: number;
} | null> {
  try {
    const response = await fetch("https://ipapi.co/json/");

    if (!response.ok) {
      return null;
    }

    const data: { latitude: number; longitude: number } = await response.json();

    return { latitude: data.latitude, longitude: data.longitude };
  } catch {
    return null;
  }
}

/**
 * Resolves the user's current geographic position. Tries the browser
 * Geolocation API first for high accuracy, and falls back to IP-based
 * geolocation (ipapi.co) when the native API is unavailable or denied.
 *
 * @returns An object with `latitude` and `longitude`, or `null` if both
 *   methods fail.
 */
async function getCurrentPosition(): Promise<{
  latitude: number;
  longitude: number;
} | null> {
  const browserPosition = await getBrowserPosition();

  if (browserPosition) {
    return browserPosition;
  }

  return getIpPosition();
}

/**
 * Fetches the current weather from the Open-Meteo API for the given
 * coordinates.
 *
 * @param latitude  - Latitude coordinate.
 * @param longitude - Longitude coordinate.
 * @returns The parsed weather data, or `null` on failure.
 */
async function fetchWeather(
  latitude: number,
  longitude: number
): Promise<WeatherData | null> {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", latitude.toFixed(4));
  url.searchParams.set("longitude", longitude.toFixed(4));
  url.searchParams.set("current_weather", "true");
  url.searchParams.set("timezone", "auto");

  const response = await fetch(url.toString());

  if (!response.ok) {
    return null;
  }

  const data: OpenMeteoCurrentWeatherResponse = await response.json();
  const wmoCode = data.current_weather.weathercode;

  return {
    temperature: Math.round(data.current_weather.temperature),
    condition: WMO_CONDITIONS[wmoCode] ?? "Unknown",
    emoji: WMO_EMOJI[wmoCode] ?? "❓",
    wmoCode,
  };
}

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

/**
 * No-op error handler used when the caller intentionally discards a promise
 * rejection (e.g. inside `useEffect` where the hook's own state already
 * captures the error).
 */
function ignoreError(_error: unknown): void {
  // Error state is already managed inside the hook's loadWeather callback.
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Hook that fetches and returns the current weather for the user's location.
 * It uses the browser's Geolocation API to determine the user's coordinates
 * and then queries the free Open-Meteo weather API (no API key required).
 *
 * The weather is refreshed on a configurable interval — by default every
 * 30 minutes.
 *
 * @param options - Configuration options.
 * @param options.updateInterval - How often the weather refreshes (ms).
 *   Defaults to 1_800_000 (30 minutes).
 *
 * @example
 * ```tsx
 * const { weather, isLoading, error } = useWeather();
 * // weather?.temperature → 22
 * // weather?.condition   → "Partly cloudy"
 * // weather?.emoji       → "⛅"
 * ```
 */
function useWeather(options: UseWeatherOptions = {}): UseWeatherReturn {
  const { updateInterval = 1_800_000 } = options;

  const [weather, setWeather] = useState<WeatherData | null>(() => {
    const cached = readCache<CachedWeather>(WEATHER_CACHE_KEY);

    if (cached && Date.now() - cached.timestamp < updateInterval) {
      return cached.data;
    }

    return null;
  });

  const [isLoading, setIsLoading] = useState(() => {
    // If we already have cached weather, skip the loading state entirely.
    const cached = readCache<CachedWeather>(WEATHER_CACHE_KEY);
    return !(cached && Date.now() - cached.timestamp < updateInterval);
  });

  const [error, setError] = useState<string | null>(null);

  /**
   * Fetches the current weather: gets the user's position (with caching),
   * then queries the Open-Meteo API. On success the result is written to
   * localStorage so subsequent mounts can reuse it without hitting rate
   * limits.
   */
  const loadWeather = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    // Resolve position — prefer browser GPS, fall back to IP geolocation,
    // and cache the result so we don't re-query on every mount.
    let position: { latitude: number; longitude: number } | null = null;

    const cachedPosition = readCache<CachedPosition>(POSITION_CACHE_KEY);

    if (
      cachedPosition &&
      Date.now() - cachedPosition.timestamp < POSITION_CACHE_TTL
    ) {
      position = {
        latitude: cachedPosition.latitude,
        longitude: cachedPosition.longitude,
      };
    } else {
      position = await getCurrentPosition();

      if (position) {
        writeCache<CachedPosition>(POSITION_CACHE_KEY, {
          latitude: position.latitude,
          longitude: position.longitude,
          timestamp: Date.now(),
        });
      }
    }

    if (!position) {
      setError("Unable to determine location");
      setIsLoading(false);
      return;
    }

    const data = await fetchWeather(position.latitude, position.longitude);

    if (!data) {
      setError("Failed to fetch weather");
      setIsLoading(false);
      return;
    }

    writeCache<CachedWeather>(WEATHER_CACHE_KEY, {
      data,
      timestamp: Date.now(),
    });

    setWeather(data);
    setIsLoading(false);
  }, []);

  // Fetch on mount
  useEffect(() => {
    loadWeather().catch(ignoreError);
  }, [loadWeather]);

  // Periodic refresh
  useEffect(() => {
    const interval = setInterval(() => {
      loadWeather().catch(ignoreError);
    }, updateInterval);

    return () => clearInterval(interval);
  }, [loadWeather, updateInterval]);

  return { weather, isLoading, error };
}

export {
  type UseWeatherOptions,
  type UseWeatherReturn,
  useWeather,
  type WeatherData,
  type WmoCode,
};
