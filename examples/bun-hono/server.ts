import { Hono } from "hono";
import { getImgResponse } from "openimg-node";

const app = new Hono();

app.get("/", (c) => {
  return c.json({ message: "Hello Bun!" });
});

app.get("/img", (c) => {
  return getImgResponse(c.req.raw);
});

app.get("*", async (c) => {
  const url = new URL(c.req.url);
  const path = url.pathname;
  const file = Bun.file("public" + path);
  if (await file.exists()) {
    return new Response(file.stream());
  }
  return new Response("Not found", { status: 404 });
});

const port = parseInt(process.env.PORT!) || 3000;
console.log(`Running at http://localhost:${port}`);

export default {
  port,
  fetch: app.fetch,
};
