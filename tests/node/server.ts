import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { getImgResponse } from "openimg/node";

const app = new Hono();

app.get("*", async (c) => {
  const headers = new Headers();
  headers.set("x-openimg-test", "true");
  return getImgResponse(c.req.raw, { headers });
});

const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;
console.log(`Server started on port ${port}`);

serve({
  fetch: app.fetch,
  port,
});
