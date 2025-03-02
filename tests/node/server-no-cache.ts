import { getImgResponse } from "openimg/node";
import http from "node:http";

const server = http.createServer(async (req, res) => {
  const headers = {
    "x-openimg-test": "true",
  };

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

  // Use a non-existent cache folder to effectively disable caching
  const response = await getImgResponse(request, {
    headers,
    cacheFolder: "no_cache",
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

// Don't start the server immediately when imported for testing
if (process.env.NODE_ENV !== "test") {
  server.listen(3001, () => {
    console.log("No-cache server started on port 3001");
  });
}

// Export the server for testing
export default server;
