import { CloudIcon, CloudOffIcon, LoaderCircleIcon } from "lucide-react";
import { useAppContext } from "@/contexts/app-context";
import { useWeather } from "@/hooks/use-weather";

/**
 * A pill-shaped badge that displays the current weather for the user's
 * location. When WiFi is unavailable it shows a disconnected state; when
 * loading it shows a spinner; when the weather is fetched successfully it
 * shows the temperature and a representative emoji.
 *
 * Self-contained — it owns both the weather data fetching and the display
 * logic, so it can be dropped anywhere in the app without extra wiring.
 */
export default function WeatherBadge() {
  const { isWifiAvailable } = useAppContext();
  const { weather, isLoading } = useWeather();

  if (!isWifiAvailable) {
    return (
      <span className="inline-flex items-center gap-x-2 rounded-xl bg-secondary px-4 py-2 text-white">
        Clima no disponible <CloudOffIcon size={18} />
      </span>
    );
  }

  if (isLoading) {
    return (
      <span className="inline-flex items-center gap-x-2 rounded-xl bg-secondary px-4 py-2 text-white">
        <LoaderCircleIcon className="animate-spin" size={18} />
      </span>
    );
  }

  if (weather) {
    return (
      <span className="inline-flex items-center gap-x-2 rounded-xl bg-secondary px-4 py-2 text-white">
        <span
          aria-label={weather.condition}
          className="text-lg leading-none"
          role="img"
        >
          {weather.emoji}
        </span>
        {weather.temperature}°C
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-x-2 rounded-xl bg-secondary px-4 py-2 text-white">
      Clima no disponible <CloudIcon size={18} />
    </span>
  );
}
