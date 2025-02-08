// import { getImgResponse } from "openimg-node";
// import { getImgResponse } from "openimg-bun";
import { getImgResponse, getImgPlaceholderResponse } from "openimg/bun";

Bun.serve({
  port: 3000,
  async fetch(req) {
    const url = new URL(req.url);
    if (url.pathname === "/placeholder") {
      return getImgPlaceholderResponse(req);
    }
    return getImgResponse(req);
  },
});
