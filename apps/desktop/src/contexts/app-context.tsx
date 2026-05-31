import ScreenSaver from "@components/screen-saver";
import StatusBar from "@components/status-bar";
import { TabProvider } from "@components/tab-provider";
import { invoke } from "@tauri-apps/api/core";
import { type Platform, platform } from "@tauri-apps/plugin-os";
import { AnimatePresence } from "motion/react";
import { createContext, useContext, useEffect, useState } from "react";
import { cn } from "tailwind-variants";

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
];

export interface AppContextType {
  currentPlatform: Platform;
  currentTab: Tab;
  handleChangeTab: (tabId: string | undefined) => void;
  handleSignIn: () => void;
  handleToggleScreenSaver: (value: boolean) => void;
  isWifiAvailable: boolean;
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
      setCurrentTab(tabs[0]);
      return;
    }

    const tab = tabs.find((t) => t.id === tabId);

    if (tab) {
      localStorage.setItem("lastTabId", tabId); // Persist the last active tab
      setCurrentTab(tab);
      return;
    }

    if (!tab) {
      throw new Error(`Tab with id ${tabId} not found`);
    }
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
    user,
    handleSignIn,
  };

  return (
    <AppContext.Provider value={value}>
      <main
        className={cn(
          "relative z-0 flex h-screen w-screen animate-in flex-col overflow-hidden",
          {
            "max-h-120 max-w-200": currentPlatform === "macos", // Just for local developmnent
          }
        )}
      >
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
    </AppContext.Provider>
  );
}
