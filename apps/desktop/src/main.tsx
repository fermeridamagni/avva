import React from "react";
import ReactDOM from "react-dom/client";
import DefaultScreen from "@/screens/default-screen";
import "@/styles/globals.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <DefaultScreen />
  </React.StrictMode>
);
