import { CloudOffIcon, LoaderCircleIcon } from "lucide-react";
import type { HTMLAttributes } from "react";
import { tv, type VariantProps } from "tailwind-variants";
import { useAppContext } from "@/contexts/app-context";
import { useWeather } from "@/hooks/use-weather";

interface WeatherBadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof variants> {
  iconSize?: number;
}

const variants = tv({
  base: "inline-flex items-center gap-x-2 rounded-xl bg-secondary px-4 py-2 text-base text-white",
});

/**
 * A pill-shaped badge that displays the current weather for the user's
 * location. When WiFi is unavailable it shows a disconnected state; when
 * loading it shows a spinner; when the weather is fetched successfully it
 * shows the temperature and a representative emoji.
 *
 * Self-contained — it owns both the weather data fetching and the display
 * logic, so it can be dropped anywhere in the app without extra wiring.
 */
export default function WeatherBadge({
  iconSize = 18,
  className,
  ...props
}: WeatherBadgeProps) {
  const { isWifiAvailable } = useAppContext();
  const { weather, isLoading } = useWeather();

  const classNames = variants({ className });

  if (!(isWifiAvailable && weather)) {
    return (
      <span className={classNames} {...props}>
        Clima no disponible <CloudOffIcon size={iconSize} />
      </span>
    );
  }

  if (isLoading) {
    return (
      <span className={classNames} {...props}>
        <LoaderCircleIcon className="animate-spin" size={iconSize} />
      </span>
    );
  }

  return (
    <span className={classNames} {...props}>
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
