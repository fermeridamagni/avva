import ScreenSaver from "@components/screen-saver";
import StatusBar from "@components/status-bar";
import { TabProvider } from "@components/tab-provider";
import { CalendarProvider } from "@contexts/calendar-context";
import { useWebSocket } from "@hooks/use-websocket";
import { invoke } from "@tauri-apps/api/core";
import { type Platform, platform } from "@tauri-apps/plugin-os";
import { AnimatePresence } from "motion/react";
import { createContext, useContext, useEffect, useState } from "react";

export interface User {
  email?: string;
  id: string;
  name: string;
}

const DEFAULT_USER: User = {
  name: "Luna",
  id: crypto.randomUUID(),
};

export interface Tab {
  id: string;
  title?: string;
}

export const tabs: Tab[] = [
  {
    id: "home",
    title: "Inicio",
  },
  {
    id: "calendar",
    title: "Calendario",
  },
  {
    id: "settings",
    title: "Ajustes",
  },
];

export interface AppContextType {
  currentPlatform: Platform;
  currentTab: Tab;
  handleChangeTab: (tabId: string | undefined) => void;
  handleSignIn: () => void;
  handleToggleScreenSaver: (value: boolean) => void;
  isWifiAvailable: boolean;
  /** Navigate to the next (1) or previous (-1) tab. */
  navigateTab: (direction: 1 | -1) => void;
  /** Direction of the last tab transition: 1 = forward, -1 = backward. */
  swipeDirection: 1 | -1;
  user: User;
}

const AppContext = createContext<AppContextType>({} as AppContextType);

export function useAppContext() {
  const context = useContext(AppContext);

  if (context === undefined) {
    throw new Error("useAppContext must be used within an AppProvider");
  }

  return context;
}

export function AppProvider() {
  const currentPlatform = platform();

  const [isScreenSaverActive, setIsScreenSaverActive] = useState(true);

  const [isWifiAvailable, setIsWifiAvailable] = useState<boolean>(
    navigator.onLine
  );
  const [user, setUser] = useState<User>(DEFAULT_USER);
  const [currentTab, setCurrentTab] = useState<Tab>(tabs[0]);
  const [swipeDirection, setSwipeDirection] = useState<1 | -1>(1);

  useWebSocket();

  // React to browser online/offline events for instant UI updates
  useEffect(() => {
    const handleOnline = () => setIsWifiAvailable(true);
    const handleOffline = () => setIsWifiAvailable(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Handle inactivity to turn on the screen saver
  useEffect(() => {
    let inactivityTimer: ReturnType<typeof setTimeout>;

    const resetTimer = () => {
      clearTimeout(inactivityTimer);
      inactivityTimer = setTimeout(() => {
        setIsScreenSaverActive(true);
      }, 120_000); // 2 minutes
    };

    resetTimer();

    window.addEventListener("mousemove", resetTimer);
    window.addEventListener("mousedown", resetTimer);
    window.addEventListener("keydown", resetTimer);
    window.addEventListener("touchstart", resetTimer);
    window.addEventListener("wheel", resetTimer);

    return () => {
      clearTimeout(inactivityTimer);
      window.removeEventListener("mousemove", resetTimer);
      window.removeEventListener("mousedown", resetTimer);
      window.removeEventListener("keydown", resetTimer);
      window.removeEventListener("touchstart", resetTimer);
      window.removeEventListener("wheel", resetTimer);
    };
  }, []);

  // Periodically verify actual internet connectivity via the Tauri backend.
  // The browser's `navigator.onLine` can be optimistic (e.g. connected to
  // WiFi but no internet access), so this acts as a ground-truth check.
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const connected = await invoke<boolean>("check_connectivity");
        setIsWifiAvailable(connected);
      } catch {
        // If the Tauri command fails, trust the navigator.onLine value
      }
    }, 10_000); // Check every 10 seconds

    return () => clearInterval(interval);
  }, []);

  const handleChangeTab = (tabId: string | undefined) => {
    if (tabId === undefined) {
      setSwipeDirection(-1);
      setCurrentTab(tabs[0]);
      return;
    }

    const tab = tabs.find((t) => t.id === tabId);

    if (tab) {
      // Determine direction based on tab index comparison
      const currentIndex = tabs.findIndex((t) => t.id === currentTab.id);
      const nextIndex = tabs.findIndex((t) => t.id === tabId);
      setSwipeDirection(nextIndex >= currentIndex ? 1 : -1);

      localStorage.setItem("lastTabId", tabId); // Persist the last active tab
      setCurrentTab(tab);
      return;
    }

    if (!tab) {
      throw new Error(`Tab with id ${tabId} not found`);
    }
  };

  /** Navigate to the next or previous tab relative to the current one. */
  const navigateTab = (direction: 1 | -1) => {
    const currentIndex = tabs.findIndex((t) => t.id === currentTab.id);
    const nextIndex = currentIndex + direction;

    // Clamp — don't wrap around
    if (nextIndex < 0 || nextIndex >= tabs.length) {
      return;
    }

    setSwipeDirection(direction);
    setCurrentTab(tabs[nextIndex]);
    localStorage.setItem("lastTabId", tabs[nextIndex].id);
  };

  const handleToggleScreenSaver = (value: boolean) => {
    setIsScreenSaverActive(value);
  };

  const handleSignIn = () => {
    // TODO: implement the sign in
    setUser(DEFAULT_USER);
  };

  const value: AppContextType = {
    currentPlatform,
    isWifiAvailable,
    currentTab,
    handleChangeTab,
    handleToggleScreenSaver,
    navigateTab,
    swipeDirection,
    user,
    handleSignIn,
  };

  return (
    <AppContext.Provider value={value}>
      <CalendarProvider>
        <main className="relative z-0 flex h-full max-h-[480px] w-full max-w-[800px] animate-in flex-col overflow-hidden bg-background">
          <AnimatePresence>
            {isScreenSaverActive ? (
              <ScreenSaver
                handleToggleScreenSaver={handleToggleScreenSaver}
                isWifiAvailable={isWifiAvailable}
              />
            ) : (
              <>
                <StatusBar isWifiAvailable={isWifiAvailable} />

                <TabProvider currentTab={currentTab} />
              </>
            )}
          </AnimatePresence>
        </main>
      </CalendarProvider>
    </AppContext.Provider>
  );
}
