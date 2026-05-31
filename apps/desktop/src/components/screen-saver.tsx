import WeatherBadge from "@components/weather-badge";
import { useCalendarContext } from "@contexts/calendar-context";
import { useFormattedTime } from "@hooks/use-formatted-time";
import { Hand, WifiOffIcon } from "lucide-react";
import { motion } from "motion/react";
import { useMemo } from "react";
import { GravityStarsBackground } from "@/components/animate-ui/components/backgrounds/gravity-stars";

/** Returns a time-appropriate greeting in Spanish. */
function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 6) {
    return "Buenas noches 🌙";
  }
  if (hour < 12) {
    return "Buenos días ☀️";
  }
  if (hour < 18) {
    return "Buenas tardes 🌤️";
  }
  return "Buenas noches 🌙";
}

/** Formats today's date as a long Spanish string (e.g. "sábado 31 de mayo"). */
function getFormattedDate(): string {
  return new Date().toLocaleDateString("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

/**
 * Full-screen screen saver with animated star background, clock, date,
 * greeting, weather, and next event preview.
 *
 * Dismisses on any touch, click, or key press.
 */
export default function ScreenSaver({
  isWifiAvailable,
  handleToggleScreenSaver,
}: {
  isWifiAvailable: boolean;
  handleToggleScreenSaver: (value: boolean) => void;
}) {
  const { formattedTime } = useFormattedTime();
  const { getEventsForDate } = useCalendarContext();

  const greeting = useMemo(() => getGreeting(), []);
  const formattedDate = useMemo(() => getFormattedDate(), []);

  const nextEvent = useMemo(() => {
    const events = getEventsForDate(new Date());
    if (events.length === 0) {
      return null;
    }

    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    // Find the next upcoming event (or the first one if all have passed)
    const upcoming = events.find((e) => {
      const [h, m] = e.startTime.split(":").map(Number);
      return h * 60 + m > currentMinutes;
    });

    return upcoming ?? events[0];
  }, [getEventsForDate]);

  return (
    <motion.div
      animate={{ y: 0, opacity: 1, scale: 1 }}
      className="absolute inset-0 z-20 flex h-full w-full cursor-pointer flex-col items-center justify-center"
      exit={{ y: -300, opacity: 0, scale: 0.92 }}
      initial={{ y: -300, opacity: 0, scale: 0.92 }}
      onClick={() => handleToggleScreenSaver(false)}
      onKeyDown={() => handleToggleScreenSaver(false)}
      onKeyUp={() => handleToggleScreenSaver(false)}
      transition={{ type: "spring", stiffness: 300, damping: 30, mass: 0.8 }}
    >
      {/* Animated star background */}
      <div className="absolute inset-0 z-0 bg-linear-to-b from-slate-950 via-slate-900 to-indigo-950">
        <GravityStarsBackground
          className="text-white"
          glowAnimation="spring"
          glowIntensity={20}
          mouseGravity="attract"
          mouseInfluence={150}
          movementSpeed={0.15}
          starsCount={90}
          starsOpacity={0.7}
          starsSize={2.5}
        />
      </div>

      {/* Content overlay */}
      <div className="relative z-10 flex flex-col items-center gap-y-5">
        {/* Greeting */}
        <motion.p
          animate={{ opacity: 1, y: 0 }}
          className="font-heading text-lg text-white/60"
          initial={{ opacity: 0, y: -10 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          {greeting}
        </motion.p>

        {/* Time */}
        <motion.h1
          animate={{ opacity: 1, scale: 1 }}
          className="font-bold font-heading text-7xl text-white tracking-tight drop-shadow-lg"
          initial={{ opacity: 0, scale: 0.9 }}
          transition={{ delay: 0.1, duration: 0.5, ease: "easeOut" }}
        >
          {formattedTime}
        </motion.h1>

        {/* Date */}
        <motion.p
          animate={{ opacity: 1, y: 0 }}
          className="font-medium text-base text-white/50 capitalize"
          initial={{ opacity: 0, y: 8 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          {formattedDate}
        </motion.p>

        {/* Weather */}
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          initial={{ opacity: 0, y: 8 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          <WeatherBadge
            className="border border-white/10 bg-white/10 backdrop-blur-md"
            iconSize={14}
          />
        </motion.div>

        {/* Next event card */}
        {nextEvent && (
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="mt-2 flex flex-col items-center gap-y-1 rounded-2xl border border-white/10 bg-white/5 px-6 py-3 backdrop-blur-md"
            initial={{ opacity: 0, y: 12 }}
            transition={{ delay: 0.7, duration: 0.5 }}
          >
            <span className="font-medium text-white/40 text-xs uppercase tracking-widest">
              Próximo evento
            </span>
            <span className="font-medium text-sm text-white/80">
              {nextEvent.title}
            </span>
            <span className="text-white/40 text-xs tabular-nums">
              {nextEvent.startTime} – {nextEvent.endTime}
            </span>
          </motion.div>
        )}

        {/* Unlock hint */}
        <motion.div
          animate={{ opacity: [0.3, 0.7, 0.3] }}
          className="mt-4 flex items-center gap-x-2 text-white/30"
          transition={{
            duration: 2.5,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}
        >
          <Hand className="size-4" />
          <span className="font-medium text-xs">Toca para desbloquear</span>
        </motion.div>
      </div>

      {/* WiFi off indicator */}
      {!isWifiAvailable && (
        <div className="absolute bottom-6 left-6 z-9999 rounded-full bg-white/10 p-4 text-white backdrop-blur-md">
          <WifiOffIcon />
        </div>
      )}
    </motion.div>
  );
}
