import HomeTab from "@tabs/home";
import { AnimatePresence } from "motion/react";
import type { Tab } from "@/contexts/app-context";

export function TabProvider({ currentTab }: { currentTab: Tab }) {
  return (
    <div className="relative h-full w-full overflow-hidden">
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
