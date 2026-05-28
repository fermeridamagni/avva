import { WifiIcon, WifiOffIcon } from "lucide-react";
import { useFormattedTime } from "@/hooks/use-formatted-time";

export default function StatusBar({
  isWifiAvailable,
}: {
  isWifiAvailable: boolean;
}) {
  const { formattedTime } = useFormattedTime();

  return (
    <div className="flex items-center justify-between gap-x-4 border-b px-2 py-1 backdrop-blur-lg">
      <div>
        <span className="font-medium text-sm">AVVA</span>
      </div>

      <div className="flex items-center gap-x-4">
        {isWifiAvailable ? (
          <WifiIcon className="size-4" />
        ) : (
          <WifiOffIcon className="size-4" />
        )}

        <span>{formattedTime}</span>
      </div>
    </div>
  );
}
