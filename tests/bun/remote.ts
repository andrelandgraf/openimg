import { getImgResponse } from "openimg/bun";

Bun.serve({
  port: 3003,
  fetch(req) {
    console.log("GET", req.url);
    const key = req.headers.get("api-key");
    if (!key || key !== "123") {
      console.error("Unauthorized");
      return new Response("Unauthorized", {
        status: 401,
      });
    }
    return getImgResponse(req);
  },
});

console.log("'remote' server running on port 3003");
