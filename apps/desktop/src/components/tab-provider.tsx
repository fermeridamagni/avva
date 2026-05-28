import HomeTab from "@tabs/home";
import { AnimatePresence } from "motion/react";
import type { Tab } from "@/contexts/app-context";

export function TabProvider({ currentTab }: { currentTab: Tab }) {
  return (
    <div className="relative h-[calc(100%-33px)] w-full flex-1 overflow-hidden">
      <AnimatePresence>
        <CurrentTabComponent currentTab={currentTab} key={currentTab.id} />
      </AnimatePresence>
    </div>
  );
}

const CurrentTabComponent = ({ currentTab }: { currentTab: Tab }) => {
  switch (currentTab.id) {
    case "home":
      return <HomeTab />;

    default:
      return <HomeTab />;
  }
};
