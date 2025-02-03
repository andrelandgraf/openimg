// import { getImgResponse } from "openimg-node";
// import { getImgResponse } from "openimg-bun";
import { getImgResponse } from "openimg/bun";

Bun.serve({
  async fetch(req) {
    return getImgResponse(req);
  },
});
