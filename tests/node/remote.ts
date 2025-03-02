import { getImgResponse } from "openimg/node";
import http from "node:http";

const server = http.createServer(async (req, res) => {
  console.log("GET", req.url);

  const key = req.headers["api-key"];
  if (!key || key !== "123") {
    console.error("Unauthorized");
    res.statusCode = 401;
    res.end("Unauthorized");
    return;
  }

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

  const response = await getImgResponse(request);

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

server.listen(3003, () => {
  console.log("'remote' server running on port 3003");
});
