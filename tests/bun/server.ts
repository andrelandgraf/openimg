import { getImgResponse } from "openimg/bun";

Bun.serve({
  port: 3000,
  async fetch(req) {
    const headers = {
      "x-openimg-test": "true",
    };
    return getImgResponse(req, { headers });
  },
});
