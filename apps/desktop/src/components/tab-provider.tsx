import type { Tab } from "@contexts/app-context";
import { tabs, useAppContext } from "@contexts/app-context";
import { useSwipeGesture } from "@hooks/use-swipe-gesture";
import CalendarTab from "@tabs/calendar";
import HomeTab from "@tabs/home";
import SettingsTab from "@tabs/settings";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useMemo } from "react";

/** Slide offset in pixels for enter/exit animations. */
const SLIDE_OFFSET = 300;

/** Spring transition for smooth, natural-feeling tab slides. */
const SLIDE_TRANSITION = {
  type: "spring" as const,
  stiffness: 300,
  damping: 30,
  mass: 0.8,
};

/** Animation variants that use the `custom` direction value. */
const slideVariants = {
  enter: (dir: number) => ({
    x: dir * SLIDE_OFFSET,
    opacity: 0,
    scale: 0.92,
  }),
  center: {
    x: 0,
    opacity: 1,
    scale: 1,
  },
  exit: (dir: number) => ({
    x: dir * -SLIDE_OFFSET,
    opacity: 0,
    scale: 0.92,
  }),
};

/**
 * Renders the current tab content with horizontal swipe-to-navigate support
 * and directional slide animations.
 *
 * Designed for Raspberry Pi touchscreen interaction — swipe left to go to the
 * next tab, swipe right to go to the previous tab. Also includes dot indicators
 * showing the current position.
 */
export function TabProvider({ currentTab }: { currentTab: Tab }) {
  const { navigateTab, swipeDirection } = useAppContext();

  const handleSwipeLeft = useCallback(() => navigateTab(1), [navigateTab]);
  const handleSwipeRight = useCallback(() => navigateTab(-1), [navigateTab]);

  const swipeHandlers = useSwipeGesture({
    onSwipeLeft: handleSwipeLeft,
    onSwipeRight: handleSwipeRight,
  });

  const currentIndex = useMemo(
    () => tabs.findIndex((t) => t.id === currentTab.id),
    [currentTab.id]
  );

  return (
    <div
      className="relative flex h-[calc(100%-36px)] w-full flex-1 flex-col overflow-hidden"
      {...swipeHandlers}
    >
      {/* Tab content with directional slide animation */}
      <div className="relative flex-1 overflow-hidden">
        <AnimatePresence
          custom={swipeDirection}
          initial={false}
          mode="popLayout"
        >
          <motion.div
            animate="center"
            className="absolute inset-0"
            custom={swipeDirection}
            exit="exit"
            initial="enter"
            key={currentTab.id}
            transition={SLIDE_TRANSITION}
            variants={slideVariants}
          >
            <CurrentTabComponent currentTab={currentTab} />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Dot indicators */}
      <div className="flex items-center justify-center gap-x-2 pt-1 pb-2">
        {tabs.map((tab, index) => (
          <motion.div
            animate={{
              width: index === currentIndex ? 20 : 6,
              height: 6,
              backgroundColor:
                index === currentIndex
                  ? "var(--color-foreground)"
                  : "var(--color-muted-foreground)",
              opacity: index === currentIndex ? 1 : 0.35,
            }}
            className="rounded-full"
            key={tab.id}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
          />
        ))}
      </div>
    </div>
  );
}

/** Maps tab IDs to their corresponding component. */
const CurrentTabComponent = ({ currentTab }: { currentTab: Tab }) => {
  switch (currentTab.id) {
    case "home":
      return <HomeTab />;
    case "calendar":
      return <CalendarTab />;
    case "settings":
      return <SettingsTab />;
    default:
      return <HomeTab />;
  }
};
