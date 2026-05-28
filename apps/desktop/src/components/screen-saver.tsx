import DefaultBackground from "@components/backgrounds/default";
import WeatherBadge from "@components/weather-badge";
import { useFormattedTime } from "@hooks/use-formatted-time";
import { WifiOffIcon } from "lucide-react";
import { motion } from "motion/react";

export default function ScreenSaver({
  isWifiAvailable,
  handleToggleScreenSaver,
}: {
  isWifiAvailable: boolean;
  handleToggleScreenSaver: (value: boolean) => void;
}) {
  const { formattedTime } = useFormattedTime();

  return (
    <motion.div
      animate={{ y: 0, opacity: 1 }}
      className="absolute inset-0 z-20 flex h-full w-full flex-col items-center justify-center gap-y-8"
      exit={{ y: "-100%", opacity: 0, filter: "blur(10px)" }}
      initial={{ y: "-10%", opacity: 0 }}
      onClick={() => handleToggleScreenSaver(false)}
      onKeyDown={() => handleToggleScreenSaver(false)}
      onKeyUp={() => handleToggleScreenSaver(false)}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      <WeatherBadge />

      <div>
        <h1 className="text-6xl">{formattedTime}</h1>
      </div>

      {!isWifiAvailable && (
        <div className="absolute bottom-6 left-6 z-9999 rounded-full bg-secondary p-4 text-white">
          <WifiOffIcon />
        </div>
      )}

      <DefaultBackground />
    </motion.div>
  );
}
