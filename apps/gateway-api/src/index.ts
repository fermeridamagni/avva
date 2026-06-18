import { Hono } from "hono";
import { websocket } from "hono/bun";
import { logger } from "hono/logger";
import eventsRouter from "@/routes/events";
import { customLogger } from "@/utils/logger";

const app = new Hono();
const port = Number.parseInt(process.env.PORT ?? "3000", 10);

app.use(logger(customLogger));

app.route("/events", eventsRouter);

export default {
  fetch: app.fetch,
  websocket,
  port,
};
