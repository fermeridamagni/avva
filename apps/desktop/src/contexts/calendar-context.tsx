import type { ReactNode } from "react";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

/** Represents a calendar event or reminder. */
export interface CalendarEvent {
  /** Color accent for the event pill. */
  color: EventColor;
  /** Date of the event (time portion ignored for day matching). */
  date: Date;
  /** Optional longer description. */
  description?: string;
  /** End time in "HH:mm" format (e.g. "10:30"). */
  endTime: string;
  /** Unique identifier for the event. */
  id: string;
  /** Start time in "HH:mm" format (e.g. "09:00"). */
  startTime: string;
  /** Short title displayed in the events panel. */
  title: string;
  /** Type of event for icon display. */
  type: "event" | "reminder" | "task";
}

/** Supported accent colors for event pills. */
export type EventColor =
  | "blue"
  | "green"
  | "orange"
  | "pink"
  | "purple"
  | "red";

export interface CalendarContextType {
  /** All available events. */
  events: CalendarEvent[];
  /** Get events filtered for a specific date. */
  getEventsForDate: (date: Date) => CalendarEvent[];
  /** Check if a date has any events. */
  hasEvents: (date: Date) => boolean;
  /** The currently selected date in the calendar. */
  selectedDate: Date;
  /** Update the selected date. */
  setSelectedDate: (date: Date) => void;
}

const CalendarContext = createContext<CalendarContextType | undefined>(
  undefined
);

/** Hook to access the calendar context. Throws if used outside a CalendarProvider. */
export function useCalendarContext(): CalendarContextType {
  const context = useContext(CalendarContext);

  if (context === undefined) {
    throw new Error(
      "useCalendarContext must be used within a CalendarProvider"
    );
  }

  return context;
}

/** Helper to compare two dates by year, month, and day only. */
function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** Generate sample events for demonstration purposes. */
function generateSampleEvents(): CalendarEvent[] {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const day = today.getDate();

  return [
    // Today's events
    {
      id: "evt-1",
      title: "Sesión de terapia de lenguaje",
      description: "Práctica con el terapeuta del habla",
      date: new Date(year, month, day),
      startTime: "09:00",
      endTime: "10:00",
      color: "blue",
      type: "event",
    },
    {
      id: "evt-2",
      title: "Práctica de señas",
      description: "Repaso de vocabulario nuevo en LSM",
      date: new Date(year, month, day),
      startTime: "11:30",
      endTime: "12:30",
      color: "purple",
      type: "task",
    },
    {
      id: "evt-3",
      title: "Recordatorio: Tomar medicina",
      date: new Date(year, month, day),
      startTime: "14:00",
      endTime: "14:15",
      color: "red",
      type: "reminder",
    },
    {
      id: "evt-4",
      title: "Videollamada con familia",
      description: "Llamada semanal por Zoom",
      date: new Date(year, month, day),
      startTime: "17:00",
      endTime: "18:00",
      color: "green",
      type: "event",
    },

    // Tomorrow's events
    {
      id: "evt-5",
      title: "Cita médica",
      description: "Revisión auditiva anual",
      date: new Date(year, month, day + 1),
      startTime: "10:00",
      endTime: "11:00",
      color: "orange",
      type: "event",
    },
    {
      id: "evt-6",
      title: "Clase de arte",
      date: new Date(year, month, day + 1),
      startTime: "15:00",
      endTime: "16:30",
      color: "pink",
      type: "event",
    },

    // Day after tomorrow
    {
      id: "evt-7",
      title: "Entrega de proyecto",
      description: "Presentación final del proyecto escolar",
      date: new Date(year, month, day + 2),
      startTime: "08:00",
      endTime: "09:00",
      color: "red",
      type: "task",
    },

    // 3 days from now
    {
      id: "evt-8",
      title: "Reunión con amigos",
      description: "Café en el centro",
      date: new Date(year, month, day + 3),
      startTime: "16:00",
      endTime: "17:30",
      color: "green",
      type: "event",
    },

    // 5 days from now
    {
      id: "evt-9",
      title: "Taller de accesibilidad",
      description: "Taller sobre tecnología asistiva",
      date: new Date(year, month, day + 5),
      startTime: "10:00",
      endTime: "13:00",
      color: "blue",
      type: "event",
    },

    // Yesterday
    {
      id: "evt-10",
      title: "Lectura del libro",
      date: new Date(year, month, day - 1),
      startTime: "20:00",
      endTime: "21:00",
      color: "purple",
      type: "task",
    },
  ];
}

/**
 * Provider that manages calendar state including the selected date and events.
 * Wraps the app so both the home mini-calendar and the full calendar tab can
 * share the selected date and event data.
 */
export function CalendarProvider({ children }: { children: ReactNode }) {
  const [selectedDate, setSelectedDateState] = useState<Date>(new Date());
  const [events] = useState<CalendarEvent[]>(generateSampleEvents);

  const setSelectedDate = useCallback((date: Date) => {
    setSelectedDateState(date);
  }, []);

  const getEventsForDate = useCallback(
    (date: Date): CalendarEvent[] =>
      events
        .filter((event) => isSameDay(event.date, date))
        .sort((a, b) => a.startTime.localeCompare(b.startTime)),
    [events]
  );

  const hasEvents = useCallback(
    (date: Date): boolean =>
      events.some((event) => isSameDay(event.date, date)),
    [events]
  );

  const value = useMemo<CalendarContextType>(
    () => ({
      selectedDate,
      setSelectedDate,
      events,
      getEventsForDate,
      hasEvents,
    }),
    [selectedDate, setSelectedDate, events, getEventsForDate, hasEvents]
  );

  return (
    <CalendarContext.Provider value={value}>
      {children}
    </CalendarContext.Provider>
  );
}
