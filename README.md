# openimg

openimg (Open Image) is a collection of JavaScript packages for working with images on the web.

## Packages

- [openimg-bun](./packages/bun/): Image optimization request handler optimized for Bun
- [openimg-node](./packages/node/): Node-compatible image optimization request handler for Bun, Deno, and Node
- [openimg-react](./packages/react/): Image React component to query for optimized images
- [openimg](./packages/core/): All-in-one package bundling `openimg/bun`, `openimg/node`, `openimg/react`

## Use cases

### Image optimization endpoint

The easiest way to use openimg is to create an image optimization endpoint in your application to optimize images from your existing web server. This is useful if you have a few images in your public folder and want to optimize them on-demand.

#### Example for Remix/React Router

Here is an example for an `/img` endpoint in Remix/React Router using `openimg/node` and `openimg/react`.

```bash
npm i openimg@latest sharp@latest
```

Note that you have to install `sharp` when using the server-side packages.

Add a new resource route in your app:

```typescript
import { getImgResponse } from "openimg/node";
import type { Route } from "./+types/img";

export function loader({ request }: Route.LoaderArgs) {
  const headers = new Headers();
  headers.set("Cache-Control", "public, max-age=31536000, immutable");
  return getImgResponse(request, { headers });
}
```

The added endpoint serves optimized images when visiting `/img?src=cat.png&w=300&h=300&format=avif&fit=cover`, given `cat.png` is in the `public` folder. Note that `w`, `h`, `format`, and `fit` are optional.

Use `openimg/react` to query for optimized images in React:

```tsx
import { Img } from "openimg/react";

export default function MyComponent() {
  return <Img src="/cat.png" w={300} h={300} fit="cover" />;
}
```

By default, the `Img` component will query the `/img` endpoint for optimized images, but this can be configured via the `OpenImgContextProvider`.

#### Example for optimizing remote images

You can also easily configure the endpoint to support optimizing images from remote locations. This is useful if you have a few images on a remote server and want to optimize them on-demand.

```typescript
export async function loader({ request, context }: Route.LoaderArgs) {
  const headers = new Headers();
  headers.set("Cache-Control", "public, max-age=31536000, immutable");
  return getImgResponse(request, {
    headers,
    allowlistedOrigins: [context.config.origin, context.config.s3.url],
  });
}
```

The added endpoint supports serving optimized images fetched from its own origin and from an S3 bucket (injected via Remix/React Router's load context). Each allowlisted origin must be a valid URL, e.g. `https://example.com`. The "src" parameter can then be used to query for optimized images from remote locations, e.g. `/img?src=https://example.com/cat.png&w=300&h=300&format=webp`.

#### Example for serverless functions

In case you don't have access to a filesystem, make sure to set `cacheFolder` to `no_cache`. By default, all optimized images are cached in a local folder. In serverless environments, you can rely on HTTP caching instead.

```typescript
import { getImgResponse } from "openimg/node";

export function loader({ request }: Route.LoaderArgs) {
  const headers = new Headers();
  headers.set("Cache-Control", "public, max-age=31536000, immutable");
  return getImgResponse(request, { headers, cacheFolder: "no_cache" });
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
  port: 3001,
  async fetch(req) {
    try {
      const headers = new Headers();
      headers.set("Cache-Control", "public, max-age=31536000, immutable");
      return getImgResponse(req, {
        headers,
        allowlistedOrigins: ["http://localhost:3000", "https://example.com"],
        publicFolder: "no_public",
      });
    } catch (err: unknown) {
      console.error(err);
      return new Response("Internal Server Error", { status: 500 });
    }
  },
});

console.log(`Server listening on http://localhost:3001`);
```

This example server runs on port 3001 and is configured to not have a public folder, which means it does not host images itself. Instead, all images are fetched from remote locations, optimized, stored in a cache, and then served. It is configured to only allow the remote origins `http://localhost:3000` and `https://example.com`.

Given your web server is running on port 3000, you can visit `http://localhost:3001?src=http://localhost:3000/cat.png&w=300&h=300&format=avif&fit=cover` to fetch an image hosted on your web server's public folder.

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

## API reference

`openimg/bun` and `openimg/node` currently have the same API surface. You can read on all supported arguments and props for each package in their respective README files:

- [openimg-bun](./packages/bun/README.md)
- [openimg-node](./packages/bun/README.md)
- [openimg-react](./packages/bun/README.md)
