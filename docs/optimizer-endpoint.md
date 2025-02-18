# Image optimization endpoint

The easiest way to use openimg is to create an image optimization endpoint in your existing web server. This is useful if you have a few images hosted on your web server and/or a remote location and want to optimize them on-demand.

## Features

openimg is meant to be highly configurable. It can:

- Retrieve images from the filesystem
- Fetch images from allow-listed remote locations
- Resize images and convert them to AVIF or WebP
- Cache optimized images to disk
- Utilize HTTP caching and CDNs for caching optimized images
- Query for optimized images using the openimg React component

## Limitations

The `openimg/bun` and `openimg/node` request handlers utilize the Web Fetch API's `Request` and `Response` objects. This works great in frameworks and environments such as Bun, Cloudflare Workers, Deno, Hono, and React Router/Remix that also operate on web standards. However, if you are using Express or another framework that operates on Node's `IncomingMessage` and `ServerResponse` objects or similar, you may not be able to easily use openimg. In this case, you could instead use openimg [as a standalone server](./optimizer-server.md)`.

## Get started

To use openimg, you need to set up a new endpoint in your web server that will be responsible for optimizing images. Once set up, you can use the openimg React component or your own custom solution to query for optimized images from the server.

There isn't a lot of code to write, but depending on your set up you will want to configure openimg differently. This guide will walk you through the most common use cases. You will most likely be able to most sections that are not relevant for your use case.

### Install openimg and sharp

```bash
npm i openimg@latest sharp@latest
```

Note that [sharp](https://sharp.pixelplumbing.com/) is used for the underlying image processing. It uses [libvips](https://github.com/libvips/libvips) under the hood and can It can be used with all JavaScript runtimes that provide support for Node-API v9, including Node.js >= 18.17.0, Deno and Bun.

### Bun vs. Node

openimg's server code is available as Bun and Node.js versions. If you are using Bun as your server runtime, you can use `openimg/bun` which utilizes Bun's standard library. Otherwise, if you are using Deno or Node, use the `openimg/node` package. The API is the same for both packages.

### Create an image optimization endpoint

Import `getImgResponse` from `openimg/node` or `openimg/bun` and create a new request handler for the `/img` route in your web server. The implementation details depend on your framework, but here are two working examples for Hono (on Node) and React Router 7:

#### Hono

In your existing Hono server, add a new GET route for `/img`:

```typescript
import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { getImgResponse } from "openimg/node";

const app = new Hono();

app.get("/", (c) => {
  return c.text("Hello Hono!");
});

// Adds a new /img endpoint
app.get("/img", (c) => {
  const headers = new Headers();
  headers.set("Cache-Control", "public, max-age=31536000, immutable");
  return getImgResponse(c.req.raw, { headers });
});

const port = 3000;
console.log(`Server is running on http://localhost:${port}`);

serve({
  fetch: app.fetch,
  port,
});
```

#### React Router 7

In React Router 7 (framework mode) and Remix, add a new resource route in your app for the route `/img`, e.g., `app/routes/img.tsx` if you are using file-based routing:

```typescript
import { getImgResponse } from "openimg/node";
import type { Route } from "./+types/img";

export function loader({ request }: Route.LoaderArgs) {
  const headers = new Headers();
  headers.set("Cache-Control", "public, max-age=31536000, immutable");
  return getImgResponse(request, { headers });
}
```

### Query images

By default, `getImgResponse` will source images from the `./public` directory and cache files to `./data/img`. You can change this via the config options, including allowlisting remote origins.

Add a `public` folder to the root folder with an image (png, jpg), e.g., `cat.png` and visit `http://localhost:3000/img?src=/cat.png&w=300&h=300&format=avif&fit=cover` to see the optimized image. Only the `src` parameter is required. All other parameters are optional.

The following search parameters are supported by default:

- `src`: The source image. This can be a local file path or a full URL. By default, if it is a full URL, the image will be fetched from the origin. If it is a local file path, the image will be read from the file system: `"./public" + src`.
- `w` (optional, defaults to original image width): The target width of the image.
- `h` (optional, defaults to original image height): The target height of the image.
- `fit` (optional, defaults to 'cover'): The fit mode of the image if the image is resized.
- `format` (optional, defaults to original image format): The target format of the image.

### Configure getImgResponse

`getImgResponse` accepts two arguments, a `Request` object and a configuration object. The configuration object accepts the following options:

- `headers`: HTTP headers to be added to the HTTP response.
- `cacheFolder`: The location to cache optimized images to. Can be set to either a string path or `no_cache` to not cache to disk.
- `allowlistedOrigins`: List of allowed remote origins. Defaults to none and can also be set to all (`['*']`).
- `getImgParams`: Provide a custom function to retrieve the image parameters from the request.
- `getImgSource`: Provide a function to map the `src` image parameter to a image source image. This is useful if you have several locations for hosted images and want provide a custom mapper.

The most common use cases are documented in this doc. However, you can also read the full API reference for `openimg/bun` and `openimg/node` here:

- [openimg-bun](../packages/bun/README.md)
- [openimg-node](../packages/node/README.md)

#### Configure where to retrieve images from

First, you have to decide where to retrieve images from. By default, `getImgResponse` will take the `src` search parameter and map it to either a absolute URL or relative file system path. However, you can provide your own `getImgSource` implementation to change the default behavior and map `src` to a different location.

The default implementation looks as follows:

```typescript
export function getImgSource(params: ImgParams): ImgSource {
  const src = params.src; // "https://example.com/folder/cat.png", "/cat.png"
  const srcUrl = parseUrl(src);

  if (srcUrl) {
    return {
      type: "fetch",
      url: src,
    };
  }
  return {
    type: "fs",
    path: "./public" + src,
  };
}
```

Note that the result from `getImgSource` will further be validated against the `allowlistedOrigins` config option.

You may have to override the default `getImgSource` function if you want to prevent using the file system, even for local images, or if you have different locations for hosted images, e.g., dev vs. production:

```typescript
export function getImgSource(params: ImgParams): ImgSource {
  const src = params.src;
  const srcUrl = parseUrl(src);

  const isDev = process.env.NODE_ENV === "development";
  const folder = isDev ? "./public" : "./build/client/assets";
  return {
    type: "fs",
    path: folder + src,
  };
}
```

You then pass the custom `getImgSource` function to `getImgResponse`:

```typescript
getImgResponse(c.req.raw, { getImgSource });
```

#### Optimizing remote images

By default, `getImgResponse` will only optimize images that are hosted on the same origin as the server and return 403 for absolute URL src parameters. You can configure the `allowlistedOrigins` option to allow remote images from other origins.

```typescript
getImgResponse(c.req.raw, {
  allowlistedOrigins: [
    "http://localhost:3000",
    "https://example.com",
    "https://aws-s3-bucket.s3.eu-central-1.amazonaws.com",
  ],
});
```

This is particularly useful if you want to optimize images from a remote S3 bucket or another remote location. You can also set `allowlistedOrigins` to `['*']` to allow all origins. However, this is not recommended for production environments.

#### Configure where to cache images

By default, all optimized images are cached at `./data/img`. You can configure the cache location via the `cacheFolder` option. In case you don't have access to a filesystem, make sure to set `cacheFolder` to `no_cache`. You can rely utilize HTTP caching & CDNs instead for caching the optimized images.

```typescript
getImgResponse(c.req.raw, { cacheFolder: "no_cache" });
```

### Using the openimg React component

openimg also includes a React component that can be used to query for optimized images. It implements many best practices for image optimization, including:

- Using the `picture` element to query for the most appropriate image format
- Using the `srcset` and `sizes` attributes to load the smallest image possible
- Enforcing width and height parameters to prevent layout shifts
- Seting fetchpriority, loading, and decoding attributes by default
- A `isAboveFold` prop to prioritize certain images via the fetchpriority, loading, and decoding attributes
- Setting role to `"presentation"` if no alt text is provided

```tsx
import { Img } from "openimg/react";

export default function MyComponent() {
  return <Img src="/cat.png" width={300} height={300} fit="cover" />;
}
```

By default, the `Img` component will query the `/img` endpoint for optimized images, but this can be configured via the `OpenImgContextProvider`.

`/img?src=https://example.com/cat.png&w=300&h=300&format=webp`.

#### Example for serverless functions

By default, optimized images are cached to `./data/img`. You can configure the cache location via the `cacheFolder` option. In case you don't have access to a filesystem, make sure to set `cacheFolder` to `no_cache`. You can rely utilize HTTP caching & CDNs instead for caching the optimized images.

In the example below, we set a cache control header to cache the optimized images for 1 year and disable the local caching:

```typescript
import { getImgResponse } from "openimg/node";

export function loader({ request }: Route.LoaderArgs) {
  const headers = new Headers();
  headers.set("Cache-Control", "public, max-age=31536000, immutable");
  return getImgResponse(request, { headers, cacheFolder: "no_cache" });
}
```

You can read about the full API reference for `openimg/react` [here](../packages/react/README.md).
