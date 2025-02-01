// import { getImgResponse } from 'openimg-node';
import { getImgResponse } from "openimg-bun";

Bun.serve({
  async fetch(req) {
    const url = new URL(req.url);
    if (url.pathname === "/img") {
      return getImgResponse(req);
    }
    console.error("No handler for ", url.pathname);
    return new Response("Not found", { status: 404 });
  },
});
