import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { getImgResponse } from "openimg/node";

const remote = "http://localhost:3003";

async function computeKey(): Promise<string> {
  return Promise.resolve("123");
}

const app = new Hono();

app.get("*", async (c) => {
  console.log("GET", c.req.url);

  return getImgResponse(c.req.raw, {
    allowlistedOrigins: [remote],
    getImgSource: async ({ request }) => {
      const src = new URL(request.url).searchParams.get("src");
      if (!src) {
        return new Response("src is required", { status: 400 });
      }
      const headers = new Headers();
      const key = await computeKey();
      headers.set("api-key", key);
      const url = remote + "/" + "?" + "src=" + src;
      console.log("fetching", url.toString());
      return {
        type: "fetch",
        url,
        headers,
      };
    },
  });
});

const port = process.env.PORT ? parseInt(process.env.PORT) : 3002;
console.log(`Remote fetch server running on port ${port}`);

serve({
  fetch: app.fetch,
  port,
});
