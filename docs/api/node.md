# openimg/node

openimg/node (Open Image Node) provides a HTTP request handler function to optimize images using sharp, using Node-compatible APIs for Bun, Deno, and Node.js. It also provides utilities for generating low quality image placeholders and retrieving image metadata.

## Features

- `getImgResponse` request handler function to optimize images using sharp
- `getImgPlaceholder` for generating low quality image placeholders from a Readable stream or image Buffer
- `getImgMetadata` for retrieving the width, height, and format of an image from a Readable stream or image Buffer

You can find the API reference for each function below.

## Limitations

The `openimg/bun` and `openimg/node` request handlers utilize the Web Fetch API's `Request` and `Response` objects. This works great in frameworks and environments such as Bun, Cloudflare Workers, Deno, Hono, and React Router/Remix that also operate on web standards. However, if you are using Express or another framework that operates on Node's `IncomingMessage` and `ServerResponse` objects or similar, you may not be able to easily use openimg. In this case, you could instead use openimg [as a standalone server](../guides/optimizer-server.md).

## Installation

The code is available via `openimg/node` and `openimg-node`. For most use cases, you probably want to install `openimg`:

```bash
npm i sharp openimg
```

However, if you only want to use the server-side utilities for Node, you can also install `openimg-node`:

```bash
npm i sharp openimg-node
```

openimg package uses [sharp](https://sharp.pixelplumbing.com) and can only be used in environments that can run sharp (and [libvips](https://github.com/libvips/libvips)).

## getImgResponse

`getImgResponse` accepts two arguments, a `Request` object and a configuration object, and it returns a promise that resolves to a `Response` object.

Import `getImgResponse` from `openimg/node` and pass in the HTTP `Request` object. The function will return an HTTP `Response` object with the optimized image.

Simple example using Hono:

```typescript
import { Hono } from "hono";
import { getImgResponse } from "openimg/node";

const app = new Hono();

app.get("/img", (c) => {
  const headers = new Headers();
  headers.set("Cache-Control", "public, max-age=31536000, immutable");
  const config = { headers };
  return getImgResponse(c.req.raw, config);
});

export default {
  port: 3000,
  fetch: app.fetch,
};
```

By default, `getImgResponse` sources images from the `./public` directory and cache files to `./data/img`. You can change this via the config options, including allowlisting remote origins.

### Query images

Add a `public` folder to the root folder with an image (png, jpg), e.g., `cat.png` and visit `http://localhost:3000/img?src=/cat.png&w=300&h=300&format=avif&fit=cover` to see the optimized image. Only the `src` parameter is required. All other parameters are optional.

The following search parameters are supported by default:

- `src`: The source image. This can be a local file path or a full URL. By default, if it is a full URL, the image will be fetched from the origin. If it is a local file path, the image will be read from the file system: `"./public" + src`.
- `w` (optional, defaults to original image width): The target width of the image.
- `h` (optional, defaults to original image height): The target height of the image.
- `fit` (optional, defaults to 'cover'): The fit mode of the image if the image is resized.
- `format` (optional, defaults to original image format): The target format of the image.

### Config options

The configuration object accepts the following optional options:

- `headers`: HTTP headers to be added to the HTTP response.
- `cacheFolder`: The location to cache optimized images to. Can be set to either a string path or `no_cache` to not cache to disk.
- `allowlistedOrigins`: List of allowed remote origins. Defaults to none and can also be set to all (`['*']`).
- `getImgParams`: Provide a custom function to retrieve the image parameters from the request.
- `getImgSource`: Provide a function to map the `src` image parameter to an image source image. This is useful if you have several locations for hosted images and want provide a custom mapper. Read more about the default `getImgSource` function below.

**headers: HeadersInit**

Headers to be added to the HTTP response.

```typescript
const headers = new Headers();
headers.set("Cache-Control", "public, max-age=31536000, immutable");
return getImgResponse(request, { headers });
```

Note, that `getImgResponse` will only set the `Content-Type` header for avif and webp images. All other headers (e.g., `Cache-Control`) must be set manually. This is to allow for more flexibility in how you want to handle caching. In most cases, you probably want to enforce unique file names and set an aggressive cache policy. It is also recommended to use a CDN in front of your image server.

**cacheFolder: string | 'no_cache'**

Defaults to `./data/img`. The folder to cache optimized images to. Can be set to either a string path or `no_cache` to not cache to disk.

```typescript
const headers = new Headers();
headers.set("Cache-Control", "public, max-age=31536000, immutable");
return getImgResponse(request, { headers, cacheFolder: "no_cache" });
```

If you set `cacheFolder` to `no_cache`, the optimized image will not be cached to disk. This is useful for serverless environments or when you want to cache the image only via a CDN.

**allowlistedOrigins: string[] | ['*']**

List of allowed remote origins. Defaults to `[]`, which means no remote origins are allowed and images will not be fetched from remote locations. Any attempt to query via absolute URLs will return a 403 response. Instead, only relative pathnames are allowed (e.g., `/cat.png`) for local images hosted on the server.

```typescript
getImgResponse(request, {
  allowlistedOrigins: ["https://example.com", "http://localhost:3000"],
});
```

Set `allowlistedOrigins` to `['*']` to allow all remote origins. You should probably only do this if your image service is within a private network. Otherwise, everyone can utilize your server to optimize any images.

**getImgParams: Function**

```typescript
type ImgParams = {
  width?: number | undefined;
  height?: number | undefined;
  fit?: Fit | undefined;
  format?: Format | undefined;
};

type GetImgParamsArgs = { request: Request };

type GetImgParams = (
  args: GetImgParamsArgs
) => Promise<ImgParams | Response> | ImgParams | Response;
```

A function that takes the `Request` object and returns an `ImgParams` object or a `Response` object. If it returns a `Response` object, the response is returned as-is. Otherwise, the returned image parameters is used to optimize the image.

The default implementation retrieves the w (width), h (height), fit, format values from the search parameters of the request and you probably don't need to override the default `getImgParams` function used if no `getImgParams` function is provided. However, for more flexibility, you can implement your own logic to determine the image parameters.

**getImgSource: Function**

```typescript
type ImgSource =
  | {
      type: "fs";
      path: string;
    }
  | {
      type: "fetch";
      url: string;
      headers?: HeadersInit | undefined;
    };

type GetImgSourceArgs = { request: Request; params: ImgParams };

type GetImgSource = (
  args: GetImgSourceArgs
) => Promise<ImgSource | Response> | ImgSource | Response;
```

A function that takes the `Request` object and the `ImgParams` object (returned from `getImgParams`) and returns an `ImgSources` object or a `Response` object. If it returns a `Response` object, the response will be returned as-is. Otherwise, the returned image sources will be used to retrieve the source image.

The default implementation looks something like this:

```typescript
export function getImgSource({ request }: GetImgSourceArgs): ImgSource {
  const src = new URL(request.url).searchParams.get("src"); // "https://example.com/folder/cat.png", "/cat.png"
  if (!src) {
    return new Response(null, {
      status: 400,
      statusText: 'Search param "src" must be set',
    });
  }

  if (URL.canParse(src)) {
    // If the src is a valid URL, return it as a fetch source
    return {
      type: "fetch",
      url: src,
    };
  }
  // If the src is a relative path, return it as a file system source
  return {
    type: "fs",
    path: "./public" + src,
  };
}
```

Note that the result from `getImgSource` will further be validated against the `allowlistedOrigins` config option.

You may have to override the default `getImgSource` function if you want to prevent using the file system, even for local images, or if you have different locations for hosted images, e.g., dev vs. production.

Example for a custom `getImgSource` function that always returns a file from the file system, but with different folders for dev and production:

```typescript
import { GetImgSourceArgs, ImgSource } from "openimg/node";

export function getImgSource({ request }: GetImgSourceArgs): ImgSource {
  const src = new URL(request.url).searchParams.get("src"); // "https://example.com/folder/cat.png", "/cat.png"
  if (!src) {
    return new Response(null, {
      status: 400,
      statusText: 'Search param "src" must be set',
    });
  }

  if (URL.canParse(src)) {
    // Do not allow remote URLs
    return new Response(null, { status: 400, statusText: "Bad Request" });
  }
  const isDev = process.env.NODE_ENV === "development";
  const folder = isDev ? "./public" : "./build/client/assets";
  return {
    type: "fs",
    path: folder + src,
  };
}
```

Example for a custom async `getImgSource` function that adds an authorization header to the request for remote images:

```typescript
import { GetImgSourceArgs, ImgSource } from "openimg/node";

export async function getImgSource({ params }: GetImgSourceArgs): ImgSource {
  const src = new URL(request.url).searchParams.get("src"); // "https://example.com/folder/cat.png", "/cat.png"
  if (!src) {
    return new Response(null, {
      status: 400,
      statusText: 'Search param "src" must be set',
    });
  }

  if (URL.canParse(src)) {
    const headers = new Headers();
    const key = await getKey();
    headers.set("Authorization", `Bearer ${key}`);
    return {
      type: "fetch",
      url: src,
      headers,
    };
  }
  return {
    type: "fs",
    path: "./public" + src,
  };
}
```

You then pass the custom `getImgSource` function to `getImgResponse`:

```typescript
getImgResponse(request, { getImgSource });
```

## getImgPlaceholder

Import `getImgPlaceholder` from `openimg/node` and pass in a Readable stream (like `ReadStream`) or image Buffer. The function will return a low quality image placeholder as a base64-encoded string using [thumbhash](https://github.com/evanw/thumbhash). The generated string can be stored in a database or inlined in your client bundle as a placeholder until the full image is loaded.

Example using a Readable stream:

```typescript
import { getImgPlaceholder } from "openimg/node";
import { createReadStream } from "node:fs";

const stream = createReadStream("./public/cat.png");
const placeholder = await getImgPlaceholder(stream);
console.log(placeholder); // data:image/png;base64,...
```

Example using an image Buffer:

```typescript
import { getImgPlaceholder } from "openimg/node";
import { readFileSync } from "node:fs";

const buffer = createReadStream("./public/cat.png");
const placeholder = await readFileSync(buffer);
console.log(placeholder); // data:image/png;base64,...
```

## getImgMetadata

Import `getImgMetadata` from `openimg/node` and pass in a Readable stream (like `ReadStream`) or image Buffer. The function will return the width, height, and format of the image.

Example using a Readable stream:

```typescript
import { getImgMetadata } from "openimg/node";
import { createReadStream } from "node:fs";

const stream = createReadStream("./public/cat.png");
const placeholder = await getImgMetadata(stream);
console.log(placeholder); // { width: 300, height: 300, format: "png" }
```

Example using an image Buffer:

```typescript
import { getImgMetadata } from "openimg/node";
import { readFileSync } from "node:fs";

const buffer = getImgMetadata("./public/cat.png");
const placeholder = await readFileSync(buffer);
console.log(placeholder); // { width: 300, height: 300, format: "png" }
```
