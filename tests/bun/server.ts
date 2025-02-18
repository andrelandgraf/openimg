// import { getImgResponse } from "openimg-node";
// import { getImgResponse } from "openimg-bun";
import { getImgResponse } from "openimg/bun";

Bun.serve({
  port: 3000,
  async fetch(req) {
    const url = new URL(req.url);
    return getImgResponse(req);
  },
});
