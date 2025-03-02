import { getImgResponse } from "openimg/node";
import http from "node:http";

const remote = "http://localhost:3003";

async function computeKey(): Promise<string> {
  return Promise.resolve("123");
}

const server = http.createServer(async (req, res) => {
  console.log("GET", req.url);

  // getImgResponse expects a Request object, but we have an IncomingMessage
  // We need to create a proper Request object from the IncomingMessage
  const url = new URL(
    req.url || "",
    `http://${req.headers.host || "localhost"}`
  );
  const request = new Request(url.toString(), {
    method: req.method,
    headers: req.headers as HeadersInit,
  });

  const response = await getImgResponse(request, {
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

  // Copy status
  res.statusCode = response.status;

  // Copy headers
  response.headers.forEach((value, key) => {
    res.setHeader(key, value);
  });

  // Copy body
  const buffer = await response.arrayBuffer();
  res.end(Buffer.from(buffer));
});

server.listen(3002, () => {
  console.log("'server' server running on port 3002!");
});
