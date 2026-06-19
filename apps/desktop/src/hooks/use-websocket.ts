import { useEffect, useRef } from "react";
import { toast } from "sonner";

const WS_URL =
  import.meta.env.VITE_GATEWAY_WS_URL || "ws://localhost:3000/events";

export function useWebSocket() {
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    let reconnectTimeout: ReturnType<typeof setTimeout>;

    const connect = () => {
      ws.current = new WebSocket(WS_URL);

      ws.current.onopen = () => {
        console.log("Connected to Gateway API WebSocket");
      };

      ws.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === "sign" && data.sign) {
            let signName = data.sign;
            // Map known signs to user-friendly names
            const signMap: Record<string, string> = {
              TOGGLE_LIGHT: "Luz",
              TOGGLE_FAN_1: "Ventilador 1",
              TOGGLE_FAN_2: "Ventilador 2",
              TOGGLE_TV: "TV",
            };

            if (signMap[signName]) {
              signName = signMap[signName];
            }

            toast.info("Comando detectado!", {
              description: `Cambiando estado de ${signName},`,
            });
          }
        } catch (err) {
          console.error("Failed to parse websocket message", err);
        }
      };

      ws.current.onclose = () => {
        console.log("WebSocket connection closed. Reconnecting...");
        reconnectTimeout = setTimeout(connect, 3000); // Reconnect after 3 seconds
      };

      ws.current.onerror = (err) => {
        console.error("WebSocket error:", err);
        ws.current?.close();
      };
    };

    connect();

    return () => {
      clearTimeout(reconnectTimeout);
      if (ws.current) {
        // Prevent reconnect logic from firing when unmounting
        ws.current.onclose = null;
        ws.current.close();
      }
    };
  }, []);
}
