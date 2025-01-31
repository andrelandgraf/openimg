// import { getImgResponse } from 'openimg-node';
import { getImgResponse } from "openimg-bun";

Bun.serve({
  async fetch(req) {
    const url = new URL(req.url);
    if (url.pathname === "/img") {
      return getImgResponse(req);
    }
    const path = url.pathname;
    const file = Bun.file("public" + path);
    if (await file.exists()) {
      return new Response(file.stream());
    }
    console.error("No handler for ", url.pathname);
    return new Response("Not found", { status: 404 });
  },
});
