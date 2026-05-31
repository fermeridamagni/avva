import { WifiIcon, WifiOffIcon } from "lucide-react";
import { useFormattedTime } from "@/hooks/use-formatted-time";
import WeatherBadge from "./weather-badge";

export default function StatusBar({
  isWifiAvailable,
}: {
  isWifiAvailable: boolean;
}) {
  const { formattedTime } = useFormattedTime();

  return (
    <nav className="flex h-9 items-center justify-between gap-x-4 border-b px-2 py-1 backdrop-blur-lg">
      <div>
        <span className="font-logo font-medium text-sm">AVVA</span>
      </div>

      <div className="flex items-center gap-x-4">
        <WeatherBadge className="px-2.5 py-1.5 text-xs" iconSize={10} />

        {isWifiAvailable ? (
          <WifiIcon className="size-5" />
        ) : (
          <WifiOffIcon className="size-5" />
        )}

        <span>{formattedTime}</span>
      </div>
    </nav>
  );
}
