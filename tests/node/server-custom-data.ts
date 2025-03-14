import { createReadStream } from "fs";
import { getImgResponse } from "openimg/node";
import { serve } from "@hono/node-server";
import { Hono } from "hono";

const app = new Hono();

app.get("*", async (c) => {
  return getImgResponse(c.req.raw, {
    getImgSource: () => {
      const cat = createReadStream("./public/cat.png");
      return {
        type: "data",
        data: cat,
        cacheKey: "cat",
      };
    },
  });
});

const port = 3006;
console.log(`Custom data server running on port ${port}`);

serve({
  fetch: app.fetch,
  port,
});
