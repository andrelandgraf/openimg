import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { getImgResponse } from "openimg/node";

const app = new Hono();

app.get("*", async (c) => {
  const key = c.req.header("api-key");
  if (!key || key !== "123") {
    console.error("Unauthorized");
    return new Response("Unauthorized", { status: 401 });
  }

  return getImgResponse(c.req.raw);
});

const port = process.env.PORT ? parseInt(process.env.PORT) : 3003;
console.log(`Remote server running on port ${port}`);

serve({
  fetch: app.fetch,
  port,
});
