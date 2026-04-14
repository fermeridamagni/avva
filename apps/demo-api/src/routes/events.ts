import { Hono } from "hono";
import { upgradeWebSocket } from "hono/bun";
import { customLogger } from "@/utils/logger";

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

      const parsed = JSON.parse(payload);

      customLogger("Received message:", payload);

      ws.send(
        JSON.stringify({
          type: parsed.type,
          message: parsed.message,
          sentAt: new Date().toISOString(),
        })
      );
    },
  }))
);

export default app;
