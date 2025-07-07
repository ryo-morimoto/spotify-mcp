import { Hono } from "hono";
import { cors } from "hono/cors";
import type { KVNamespace } from "@cloudflare/workers-types";

type Bindings = {
  CLIENT_ID: string;
  CLIENT_SECRET: string;
  OAUTH_KV: KVNamespace;
  CORS_ORIGIN: string;
};

const app = new Hono<{ Bindings: Bindings }>();

// Simple CORS setup
app.use(
  "*",
  cors({
    origin: (_origin, c) => c.env.CORS_ORIGIN || "*",
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["Content-Type"],
  }),
);

// Health check endpoint
app.get("/", (c) => c.json({ status: "ok" }));

export default app;
