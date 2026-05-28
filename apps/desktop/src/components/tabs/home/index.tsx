import { useAppContext } from "@contexts/app-context";
import { Calendar } from "@ui/calendar";
import { es } from "date-fns/locale";
import { motion } from "motion/react";
import { useEffect, useState } from "react";

export default function HomeTab() {
  const { user } = useAppContext();

  const [date, setDate] = useState<Date | undefined>(new Date());
  const [timeZone, setTimeZone] = useState<string | undefined>(undefined);

  useEffect(() => {
    setTimeZone(Intl.DateTimeFormat().resolvedOptions().timeZone);
  }, []);

  return (
    <motion.div
      animate={{ opacity: 1, scale: 1 }}
      className="grid h-[calc(100%-33px)] w-full grid-cols-2"
      exit={{ opacity: 0, scale: 0.95 }}
      initial={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
    >
      <div className="flex w-full flex-col items-center justify-center gap-y-4 p-4">
        <span className="text-3xl">Hola, {user.name}!</span>

        <span className="text-2xl">¿En qué puedo ayudarte hoy?</span>
      </div>

      <div className="flex items-center p-6">
        <div className="flex w-full items-center justify-center overflow-hidden rounded-4xl border">
          <Calendar
            captionLayout="dropdown"
            className="[--cell-size:--spacing(10)] md:[--cell-size:--spacing(11)]"
            locale={es}
            mode="single"
            numberOfMonths={1}
            onSelect={() => setDate(new Date())}
            selected={date}
            timeZone={timeZone}
          />
        </div>
      </div>
    </motion.div>
  );
}
