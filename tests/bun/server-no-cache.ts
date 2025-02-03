// import { getImgResponse } from "openimg-node";
import { getImgResponse } from "openimg-bun";
// import { getImgResponse } from "openimg/bun";

Bun.serve({
  port: 3001,
  async fetch(req) {
    return getImgResponse(req, { cacheFolder: "no_cache" });
  },
});
