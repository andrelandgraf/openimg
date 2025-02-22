// import { getImgResponse } from "openimg-node";
// import { getImgResponse } from "openimg-bun";
import { getImgResponse } from "openimg/node";

Bun.serve({
  port: 3000,
  async fetch(req) {
    const headers = {
      "x-openimg-test": "true",
    };
    return getImgResponse(req, { headers });
  },
});
