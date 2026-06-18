import React from "react";
import ReactDOM from "react-dom/client";
import { AppProvider } from "@/contexts/app-context";
import { Toaster } from "@/components/ui/sonner";
import "@/styles/globals.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <AppProvider />
    <Toaster />
  </React.StrictMode>
);
