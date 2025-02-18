# Standalone server

You can also easily spin up a custom image optimization server. Below is an example using Bun:

```bash
npm i openimg@latest sharp@latest
```

```typescript
import { getImgResponse } from "openimg/bun";

Bun.serve({
  port: 3001,
  async fetch(req) {
    try {
      const headers = new Headers();
      headers.set("Cache-Control", "public, max-age=31536000, immutable");
      return getImgResponse(req, {
        headers,
        allowlistedOrigins: ["http://localhost:3000", "https://example.com"],
      });
    } catch (err: unknown) {
      console.error(err);
      return new Response("Internal Server Error", { status: 500 });
    }
  },
});

console.log(`Server listening on http://localhost:3001`);
```

This example server runs on port 3001 and supports fetching original images from two remote origins. Given your web server is running on port 3000, you can visit `http://localhost:3001?src=http://localhost:3000/cat.png&w=300&h=300&format=avif&fit=cover` to fetch an image hosted on your web server's public folder.

You can configure `openimg/react` to query images from a standalone image optimization server by wrapping your app in `OpenImgContextProvider`:

```tsx
import { OpenImgContextProvider, Img } from "openimg/react";

export default function App() {
  return (
    <OpenImgContextProvider optimizerEndpoint="http://localhost:3001">
      <Img
        src="http://localhost:3000/image.jpg"
        width={1200}
        height={800}
        fit="contain"
        alt="Example Image"
      />
    </OpenImgContextProvider>
  );
}
```
