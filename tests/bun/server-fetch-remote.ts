import { getImgResponse } from "openimg/bun";

const remote = "http://localhost:3003";

async function computeKey(): Promise<string> {
  return Promise.resolve("123");
}

Bun.serve({
  port: 3002,
  async fetch(req) {
    console.log("GET", req.url);
    return getImgResponse(req, {
      allowlistedOrigins: [remote],
      getImgSource: async ({ request }) => {
        const src = new URL(request.url).searchParams.get("src");
        if (!src) {
          return new Response("src is required", { status: 400 });
        }
        const headers = new Headers();
        const key = await computeKey();
        headers.set("api-key", key);
        const url = remote + "/" + "?" + "src=" + src;
        console.log("fetching", url.toString());
        return {
          type: "fetch",
          url,
          headers,
        };
      },
    });
  },
});

console.log("'server' server running on port 3002!");
