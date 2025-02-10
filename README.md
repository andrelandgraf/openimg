# openimg

openimg (Open Image) is a collection of JavaScript packages for working with images on the web.

## Packages

- [openimg-bun](./packages/bun/): Image optimization request handler for Bun
- [openimg-node](./packages/node/): Node-compatible image optimization request handler for Bun, Deno, and Node
- [openimg-react](./packages/react/): Image React component to query for optimized images
- [openimg](./packages/core/): All-in-one package bundling `openimg/bun`, `openimg/node`, `openimg/react`

## Use cases

### Image optimization endpoint

The easiest way to use openimg is to create an image optimization endpoint in your application to optimize images from your existing web server.

Below is an example for an `/img` endpoint in Remix/React Router using `openimg/node` and `openimg/react`:

```bash
npm i openimg@latest sharp@latest
```

Note that you have to install `sharp` when using the server-side packages.

```typescript
import type { Route } from "./+types/img";
import { getImgResponse } from "openimg/node";

export function loader({ request }: Route.LoaderArgs) {
  const headers = new Headers();
  headers.set("Cache-Control", "public, max-age=31536000, immutable");
  return getImgResponse(request, { headers });
}
```

You can serve optimized images by visiting `http://localhost:3000/img?src=cat.png&w=300&h=300&format=avif&fit=cover`, given `cat.png` is in the `public` folder. You can further use `openimg/react` to query for optimized images in your React components. It will automatically query the `/img` endpoint for optimized images by default:

```tsx
import { Img } from "openimg/react";

export default function MyComponent() {
  return <Img src="/cat.png" w={300} h={300} fit="cover" />;
}
```

### Standalone server

You can also easily spin up a custom image optimization server. Below is an example using Bun:

```bash
npm i openimg@latest sharp@latest
```

```typescript
import { getImgResponse } from "openimg/bun";

Bun.serve({
  async fetch(req) {
    try {
      const headers = new Headers();
      const allowlistedOrigins = [
        "http://localhost:3001",
        "https://example.com",
      ];
      headers.set("Cache-Control", "public, max-age=31536000, immutable");
      return getImgResponse(req, {
        headers,
        allowlistedOrigins,
      });
    } catch (err: unknown) {
      console.error(err);
      return new Response("Internal Server Error", { status: 500 });
    }
  },
});

console.log(`Server listening on http://localhost:3000`);
```

By default, this server will store/cache optimized images in the `./data/img` folder. Given you have your web server running on port 3001, you can make requests from your web server to the image optimization server on port 3000. Visit `http://localhost:3000?src=http://localhost:3001/cat.png&w=300&h=300&format=avif&fit=cover` to see the optimized image, given your web server is running on port 3001 and can serve `cat.png`.

You can configure `openimg/react` to query the image optimization server by wrapping your app in `OpenImgContextProvider`:

```tsx
import { OpenImgContextProvider, Img } from "openimg/react";

export default function App() {
  return (
    <OpenImgContextProvider optimizerSrc="http://localhost:3000">
      <Img
        src="http://localhost:3001/image.jpg"
        width={1200}
        height={800}
        fit="contain"
        alt="Example Image"
      />
    </OpenImgContextProvider>
  );
}
```
