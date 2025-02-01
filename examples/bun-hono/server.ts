import { Hono } from "hono";
// import { getImgResponse } from "openimg-node";
// import { getImgResponse } from "openimg-bun";
import { getImgResponse } from "openimg/node";

const app = new Hono();

app.get("/img", (c) => {
  const headers = new Headers();
  headers.set("Cache-Control", "public, max-age=31536000, immutable");
  const config = { headers };
  return getImgResponse(c.req.raw, config);
});

const port = parseInt(process.env.PORT!) || 3000;
console.log(`Running at http://localhost:${port}`);

export default {
  port,
  fetch: app.fetch,
};
