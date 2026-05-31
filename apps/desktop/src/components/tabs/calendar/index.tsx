import type { CalendarEvent, EventColor } from "@contexts/calendar-context";
import { useCalendarContext } from "@contexts/calendar-context";
import { Calendar } from "@ui/calendar";
import { ScrollArea } from "@ui/scroll-area";
import { es } from "date-fns/locale";
import {
  Bell,
  CalendarDays,
  CheckSquare,
  Clock,
  PartyPopper,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";

/** Map event colors to Tailwind-compatible gradient/bg classes. */
const COLOR_MAP: Record<
  EventColor,
  { bg: string; border: string; dot: string }
> = {
  blue: {
    bg: "bg-blue-50",
    border: "border-l-blue-500",
    dot: "bg-blue-500",
  },
  green: {
    bg: "bg-emerald-50",
    border: "border-l-emerald-500",
    dot: "bg-emerald-500",
  },
  orange: {
    bg: "bg-amber-50",
    border: "border-l-amber-500",
    dot: "bg-amber-500",
  },
  pink: {
    bg: "bg-pink-50",
    border: "border-l-pink-500",
    dot: "bg-pink-500",
  },
  purple: {
    bg: "bg-violet-50",
    border: "border-l-violet-500",
    dot: "bg-violet-500",
  },
  red: {
    bg: "bg-red-50",
    border: "border-l-red-500",
    dot: "bg-red-500",
  },
};

/** Icon component for each event type. */
function EventTypeIcon({ type }: { type: CalendarEvent["type"] }) {
  const className = "size-3.5 text-muted-foreground";

  switch (type) {
    case "event":
      return <CalendarDays className={className} />;
    case "reminder":
      return <Bell className={className} />;
    case "task":
      return <CheckSquare className={className} />;
    default:
      return null;
  }
}

/** Formats a Date as a human-readable Spanish date string. */
function formatDateHeader(date: Date): string {
  return date.toLocaleDateString("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/** Checks if two dates are the same calendar day. */
function isToday(date: Date): boolean {
  const today = new Date();
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
}

/**
 * Full calendar tab with two-column layout:
 * - Left: interactive calendar picker
 * - Right: scrollable events/reminders panel for the selected date
 */
export default function CalendarTab() {
  const { selectedDate, setSelectedDate, getEventsForDate, hasEvents } =
    useCalendarContext();

  const [timeZone, setTimeZone] = useState<string | undefined>(undefined);

  useEffect(() => {
    setTimeZone(Intl.DateTimeFormat().resolvedOptions().timeZone);
  }, []);

  const eventsForSelectedDate = useMemo(
    () => getEventsForDate(selectedDate),
    [getEventsForDate, selectedDate]
  );

  /** Build modifiers to mark days with events. */
  const eventDayModifiers = useMemo(() => {
    const daysWithEvents: Date[] = [];
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();

    for (let d = -15; d <= 45; d++) {
      const candidate = new Date(year, month, d);
      if (hasEvents(candidate)) {
        daysWithEvents.push(candidate);
      }
    }

    return { hasEvent: daysWithEvents };
  }, [selectedDate, hasEvents]);

  const handleDaySelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
    }
  };

  const selectedIsToday = isToday(selectedDate);

  return (
    <div className="grid h-full w-full grid-cols-[1fr_1.2fr] gap-x-0">
      {/* Left panel — Calendar */}
      <motion.div
        animate={{ opacity: 1, x: 0 }}
        className="flex flex-col items-center justify-center border-r p-4"
        initial={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.35 }}
      >
        <div className="flex w-full items-center justify-center overflow-hidden rounded-3xl border bg-white shadow-sm">
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

        {/* Legend */}
        <div className="mt-4 flex items-center gap-x-4 text-muted-foreground text-xs">
          <span className="flex items-center gap-x-1.5">
            <span className="inline-block size-2 rounded-full bg-primary" />
            Seleccionado
          </span>
          <span className="flex items-center gap-x-1.5">
            <span className="inline-block size-2 rounded-full bg-blue-500" />
            Con eventos
          </span>
        </div>
      </motion.div>

      {/* Right panel — Events & reminders */}
      <motion.div
        animate={{ opacity: 1, x: 0 }}
        className="flex flex-col overflow-hidden"
        initial={{ opacity: 0, x: 20 }}
        transition={{ duration: 0.35, delay: 0.1 }}
      >
        {/* Date header */}
        <div className="flex items-center gap-x-3 border-b px-5 py-4">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <span className="font-bold font-heading text-lg">
              {selectedDate.getDate()}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="font-heading font-semibold text-sm capitalize leading-tight">
              {formatDateHeader(selectedDate)}
            </span>
            {selectedIsToday && (
              <span className="font-medium text-blue-600 text-xs">Hoy</span>
            )}
          </div>
        </div>

        {/* Events list */}
        <ScrollArea className="flex-1">
          <div className="flex flex-col gap-y-2 p-4">
            <AnimatePresence mode="popLayout">
              {eventsForSelectedDate.length > 0 ? (
                eventsForSelectedDate.map((event, index) => (
                  <EventCard event={event} index={index} key={event.id} />
                ))
              ) : (
                <EmptyState />
              )}
            </AnimatePresence>
          </div>
        </ScrollArea>
      </motion.div>
    </div>
  );
}

/** Animated event card with color accent and stagger animation. */
function EventCard({ event, index }: { event: CalendarEvent; index: number }) {
  const colors = COLOR_MAP[event.color];

  return (
    <motion.div
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={`rounded-xl border-l-4 ${colors.border} ${colors.bg} p-3.5 shadow-xs transition-shadow hover:shadow-sm`}
      exit={{ opacity: 0, y: -8, scale: 0.95 }}
      initial={{ opacity: 0, y: 12, scale: 0.96 }}
      layout
      transition={{
        duration: 0.3,
        delay: index * 0.06,
        ease: "easeOut",
      }}
    >
      <div className="flex items-start justify-between gap-x-3">
        <div className="flex flex-1 flex-col gap-y-1">
          {/* Title row */}
          <div className="flex items-center gap-x-2">
            <EventTypeIcon type={event.type} />
            <span className="font-medium text-sm leading-tight">
              {event.title}
            </span>
          </div>

          {/* Description */}
          {event.description && (
            <p className="pl-5.5 text-muted-foreground text-xs leading-relaxed">
              {event.description}
            </p>
          )}
        </div>

        {/* Time badge */}
        <div className="flex shrink-0 items-center gap-x-1 rounded-lg bg-white/70 px-2 py-1 text-xs">
          <Clock className="size-3 text-muted-foreground" />
          <span className="font-medium tabular-nums">
            {event.startTime} – {event.endTime}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

/** Empty state shown when no events exist for the selected date. */
function EmptyState() {
  return (
    <motion.div
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center gap-y-3 py-12"
      exit={{ opacity: 0 }}
      initial={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        animate={{ rotate: [0, -10, 10, -5, 5, 0] }}
        transition={{ duration: 0.8, delay: 0.3 }}
      >
        <PartyPopper className="size-10 text-muted-foreground/50" />
      </motion.div>
      <p className="font-heading text-muted-foreground text-sm">
        Sin eventos este día
      </p>
      <p className="text-muted-foreground/70 text-xs">
        ¡Disfruta tu tiempo libre! 🎉
      </p>
    </motion.div>
  );
}
