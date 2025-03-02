import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { getImgResponse } from "openimg/node";

const app = new Hono();

app.get("*", async (c) => {
  const headers = new Headers();
  headers.set("x-openimg-test", "true");

  // Use a non-existent cache folder to effectively disable caching
  return getImgResponse(c.req.raw, {
    headers,
    cacheFolder: "no_cache",
  });
});

const port = process.env.PORT ? parseInt(process.env.PORT) : 3001;
console.log(`No-cache server started on port ${port}`);

serve({
  fetch: app.fetch,
  port,
});
