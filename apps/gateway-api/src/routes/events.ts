import { Hono } from "hono";
import { upgradeWebSocket } from "hono/bun";
import type { WSContext } from "hono/ws";
import { customLogger } from "@/utils/logger";
import { publishToArduino } from "@/utils/mqtt";

const app = new Hono();

const CONNECTED_MESSAGE = "Server connected successfully!";

// Keep track of connected clients
const clients = new Set<WSContext>();

app.get(
  "/",
  upgradeWebSocket(() => ({
    onOpen: (_, ws) => {
      clients.add(ws);
      ws.send(
        JSON.stringify({
          type: "system",
          message: CONNECTED_MESSAGE,
          sentAt: new Date().toISOString(),
        })
      );
    },
    onClose: (_, ws) => {
      clients.delete(ws);
    },
    onMessage: (event, _ws: WSContext) => {
      const payload = String(event.data);

      try {
        const parsed = JSON.parse(payload);
        customLogger("Received message:", payload);

        // If the message is intended for an Arduino, publish it to MQTT
        if (parsed.target && parsed.command) {
          publishToArduino(parsed.target, parsed.command, parsed.payload);
        }

        // Broadcast the message back to all connected clients
        const responseMessage = JSON.stringify({
          type: parsed.type || "response",
          message: parsed.message || "Command received",
          sign: parsed.sign, // In case of a sign detection
          sentAt: new Date().toISOString(),
        });

        for (const client of clients) {
          client.send(responseMessage);
        }
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
