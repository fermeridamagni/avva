import { Hono } from "hono";
import { upgradeWebSocket } from "hono/bun";
import { customLogger } from "@/utils/logger";
import { publishToArduino } from "@/utils/mqtt";

const app = new Hono();

const CONNECTED_MESSAGE = "Server connected successfully!";

app.get(
  "/",
  upgradeWebSocket(() => ({
    onOpen: (_, ws) => {
      ws.send(
        JSON.stringify({
          type: "system",
          message: CONNECTED_MESSAGE,
          sentAt: new Date().toISOString(),
        })
      );
    },
    onMessage: (event, ws) => {
      const payload = String(event.data);

      try {
        const parsed = JSON.parse(payload);
        customLogger("Received message:", payload);

        // If the message is intended for an Arduino, publish it to MQTT
        if (parsed.target && parsed.command) {
          publishToArduino(parsed.target, parsed.command, parsed.payload);
        }

        ws.send(
          JSON.stringify({
            type: parsed.type || "response",
            message: parsed.message || "Command received",
            sentAt: new Date().toISOString(),
          })
        );
      } catch (err) {
        customLogger(
          "Error parsing message:",
          err instanceof Error ? err.message : String(err)
        );
      }
    },
  }))
);

export default app;
