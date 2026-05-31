import { useAppContext } from "@contexts/app-context";
import { useCalendarContext } from "@contexts/calendar-context";
import { Calendar } from "@ui/calendar";
import { es } from "date-fns/locale";
import { motion } from "motion/react";
import { useCallback, useEffect, useMemo, useState } from "react";

/**
 * A compact, interactive calendar widget for the home screen.
 *
 * When a user taps a day, it updates the shared calendar context and
 * navigates to the dedicated calendar tab so they can see that day's
 * events and reminders.
 */
export default function MiniCalendar() {
  const { handleChangeTab } = useAppContext();
  const { selectedDate, setSelectedDate, hasEvents } = useCalendarContext();

  const [timeZone, setTimeZone] = useState<string | undefined>(undefined);

  useEffect(() => {
    setTimeZone(Intl.DateTimeFormat().resolvedOptions().timeZone);
  }, []);

  /** Navigate to the calendar tab when a day is selected. */
  const handleDaySelect = useCallback(
    (date: Date | undefined) => {
      if (!date) {
        return;
      }
      setSelectedDate(date);
      handleChangeTab("calendar");
    },
    [setSelectedDate, handleChangeTab]
  );

  /**
   * Build modifiers to highlight days that have events.
   * We check the current month ± 1 to ensure visible outside-days are marked.
   */
  const eventDayModifiers = useMemo(() => {
    const daysWithEvents: Date[] = [];
    const baseDate = selectedDate;
    const year = baseDate.getFullYear();
    const month = baseDate.getMonth();

    // Check ~45 days around the current month
    for (let d = -15; d <= 45; d++) {
      const candidate = new Date(year, month, d);
      if (hasEvents(candidate)) {
        daysWithEvents.push(candidate);
      }
    }

    return { hasEvent: daysWithEvents };
  }, [selectedDate, hasEvents]);

  return (
    <motion.div
      animate={{ opacity: 1, scale: 1 }}
      className="flex w-full flex-col items-center justify-center gap-y-3"
      initial={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.4, delay: 0.2 }}
    >
      {/* Calendar card */}
      <div className="flex w-full items-center justify-center overflow-hidden rounded-3xl border bg-white shadow-sm transition-shadow hover:shadow-md">
        <Calendar
          captionLayout="dropdown"
          className="[--cell-size:--spacing(10)] md:[--cell-size:--spacing(11)]"
          locale={es}
          mode="single"
          modifiers={eventDayModifiers}
          modifiersClassNames={{
            hasEvent: "mini-calendar-has-event",
          }}
          numberOfMonths={1}
          onSelect={handleDaySelect}
          selected={selectedDate}
          timeZone={timeZone}
        />
      </div>

      {/* Tap hint */}
      <motion.p
        animate={{ opacity: 1 }}
        className="text-center text-muted-foreground text-xs"
        initial={{ opacity: 0 }}
        transition={{ delay: 0.5 }}
      >
        Toca un día para ver eventos
      </motion.p>
    </motion.div>
  );
}
