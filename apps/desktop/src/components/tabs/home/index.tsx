import { useAppContext } from "@contexts/app-context";
import { useCalendarContext } from "@contexts/calendar-context";
import { motion } from "motion/react";
import { useMemo } from "react";
import { TypingText } from "@/components/animate-ui/primitives/texts/typing";
import MiniCalendar from "./components/mini-calendar";

/** Returns a time-appropriate greeting in Spanish. */
function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) {
    return "Buenos días";
  }
  if (hour < 18) {
    return "Buenas tardes";
  }
  return "Buenas noches";
}

/**
 * Home tab — the main landing screen.
 *
 * Left column: personalized greeting + upcoming events summary.
 * Right column: interactive mini-calendar that navigates to the calendar tab.
 */
export default function HomeTab() {
  const { user } = useAppContext();
  const { getEventsForDate } = useCalendarContext();

  const greeting = useMemo(() => getGreeting(), []);

  const todayEvents = useMemo(
    () => getEventsForDate(new Date()),
    [getEventsForDate]
  );

  const nextEvent = todayEvents.length > 0 ? todayEvents[0] : null;

  return (
    <div className="relative grid h-full w-full grid-cols-2">
      {/* Left — Greeting & summary */}
      <div className="flex h-full w-full flex-col items-center justify-center gap-y-5 p-6 text-center">
        <TypingText
          className="font-heading font-semibold text-3xl"
          duration={30}
          text={`${greeting}, ${user.name}!`}
        />

        <TypingText
          className="text-muted-foreground text-xl"
          delay={600}
          duration={25}
          text="¿En qué puedo ayudarte hoy?"
        />

        {/* Today's quick summary */}
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="mt-2 flex flex-col items-center gap-y-2"
          initial={{ opacity: 0, y: 12 }}
          transition={{ delay: 1.2, duration: 0.4 }}
        >
          {nextEvent ? (
            <div className="rounded-2xl border bg-white/80 px-5 py-3 shadow-xs backdrop-blur-sm">
              <p className="text-muted-foreground text-xs uppercase tracking-wider">
                Próximo evento
              </p>
              <p className="mt-1 font-medium text-sm">{nextEvent.title}</p>
              <p className="text-muted-foreground text-xs">
                {nextEvent.startTime} – {nextEvent.endTime}
              </p>
            </div>
          ) : (
            <div className="rounded-2xl border bg-white/80 px-5 py-3 shadow-xs backdrop-blur-sm">
              <p className="text-muted-foreground text-sm">
                No hay eventos programados hoy ✨
              </p>
            </div>
          )}

          {todayEvents.length > 1 && (
            <p className="text-muted-foreground text-xs">
              +{todayEvents.length - 1} evento
              {todayEvents.length - 1 > 1 ? "s" : ""} más hoy
            </p>
          )}
        </motion.div>
      </div>

      {/* Right — Mini calendar */}
      <div className="flex items-center p-6">
        <MiniCalendar />
      </div>
    </div>
  );
}
