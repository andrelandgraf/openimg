# openimg/bun

openimg/bun (Open Image Bun) provides an HTTP request handler function to optimize images with [sharp](https://sharp.pixelplumbing.com), using Bun APIs where possible. It also provides utilities for generating low quality image placeholders and retrieving image metadata.

## Features

- `getImgResponse` request handler function to optimize images using sharp
- `getImgPlaceholder` for generating low quality image placeholders from a Readable stream or image Buffer
- `getImgMetadata` for retrieving the width, height, and format of an image from a Readable stream or image Buffer

You can find the API reference for each function below.

## Installation

The code is available via `openimg/bun`:

```bash
npm i sharp openimg
```

Note, openimg uses [sharp](https://sharp.pixelplumbing.com) and can only be used in environments that can run sharp (and [libvips](https://github.com/libvips/libvips)).

## getImgResponse

`getImgResponse` accepts two arguments, a `Request` object and a configuration object, and it returns a promise that resolves to a `Response` object.

Import `getImgResponse` from `openimg/bun` and pass in the HTTP `Request` object. The function will return an HTTP `Response` object with the optimized image.

Simple example using Hono:

```typescript
import { Hono } from "hono";
import { getImgResponse } from "openimg/bun";

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
- `getSharpPipeline`: Provide a custom Sharp pipeline for advanced image processing. This enables custom image transformations like black & white conversion, custom filters, etc.

#### headers: HeadersInit

Headers to be added to the HTTP response.

```typescript
const headers = new Headers();
headers.set("Cache-Control", "public, max-age=31536000, immutable");
return getImgResponse(request, { headers });
```

Note, that `getImgResponse` will only set the `Content-Type` & `Content-Length` headers. All other headers (e.g., `Cache-Control`) must be set manually. This is to allow for more flexibility in how you want to handle caching. In most cases, you probably want to enforce unique file names and set an aggressive cache policy. It is also recommended to use a CDN in front of your image server.

#### cacheFolder: string | 'no_cache'

Defaults to `./data/img`. The folder to cache optimized images to. Can be set to either a string path or `no_cache` to not cache to disk.

```typescript
const headers = new Headers();
headers.set("Cache-Control", "public, max-age=31536000, immutable");
return getImgResponse(request, { headers, cacheFolder: "no_cache" });
```

If you set `cacheFolder` to `no_cache`, the optimized image will not be cached to disk. This is useful for serverless environments or when you want to cache the image only via a CDN.

#### allowlistedOrigins: string[] | ['*']

List of allowed remote origins. Defaults to `[]`, which means no remote origins are allowed and images will not be fetched from remote locations. Any attempt to query via absolute URLs will return a 403 response. Instead, only relative pathnames are allowed (e.g., `/cat.png`) for local images hosted on the server.

```typescript
getImgResponse(request, {
  allowlistedOrigins: ["https://example.com", "http://localhost:3000"],
});
```

Set `allowlistedOrigins` to `['*']` to allow all remote origins. You should probably only do this if your image service is within a private network. Otherwise, everyone can utilize your server to optimize any images.

#### getImgParams: Function

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

#### getImgSource: Function

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
    }
  | {
      type: "data";
      data: ImgData;
      cacheKey: string | null;
    };

/**
 * ImgData is the response body (ReadableStream), buffer, or other readable representation of an image.
 */
type ImgData = ReadableStream<Uint8Array> | Readable | Buffer | Uint8Array;

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

##### Example for a custom `getImgSource` function that always returns a file from the file system, but with different folders for dev and production:

```typescript
import { GetImgSourceArgs, ImgSource } from "openimg/bun";

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

##### Example for a custom async `getImgSource` function that adds an authorization header to the request for remote images:

```typescript
import { GetImgSourceArgs, ImgSource } from "openimg/bun";

export async function getImgSource({ request }: GetImgSourceArgs): ImgSource {
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

##### Example for a custom `getImgSource` function that provides image data directly:

```typescript
import { GetImgSourceArgs, ImgSource } from "openimg/bun";
import { createReadStream } from "node:fs";

export function getImgSource({ request }: GetImgSourceArgs): ImgSource {
  const src = new URL(request.url).searchParams.get("src");
  if (!src) {
    return new Response(null, {
      status: 400,
      statusText: 'Search param "src" must be set',
    });
  }

  // For a specific image, provide the data directly
  if (src === "/special-image.png") {
    const imageStream = createReadStream("./private/special-image.png");
    return {
      type: "data",
      data: imageStream,
      cacheKey: "special-image", // Provide a unique cache key for caching
    };
  }

  // For other images, use the default behavior
  if (URL.canParse(src)) {
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

**Note:** When using the `type: "data"` option, you must provide a `cacheKey` if caching is enabled (i.e., if `cacheFolder` is not set to `"no_cache"`). This is because there is no path or URL to generate a cache key from. If you don't want to cache the image, you can set `cacheKey` to `null`.

You then pass the custom `getImgSource` function to `getImgResponse`:

```typescript
getImgResponse(request, { getImgSource });
```

#### getSharpPipeline: Function

```typescript
type GetSharpPipelineArgs = { params: ImgParams; source: ImgSource };

type SharpConfig = {
  pipeline: sharp.Sharp;
  cacheKey?: string;
};

type GetSharpPipeline = (
  args: GetSharpPipelineArgs
) => Promise<SharpConfig | undefined> | SharpConfig | undefined;
```

A function that takes the `ImgParams` and `ImgSource` objects and returns a custom Sharp pipeline configuration. This allows you to implement advanced image processing features beyond the default resize and format operations.

The default implementation uses `getDefaultSharpPipeline(params)` which applies auto-orientation, resizing (if width/height specified), and format conversion.

**Return `undefined`** to use the default pipeline.  
**Return a `SharpConfig`** object with a custom pipeline and optional cache key.

**Important:** When file caching is enabled (default), you **must** provide a unique `cacheKey` for custom pipelines. This ensures different pipeline configurations don't serve cached results from other pipelines.

##### Example for a black & white filter:

```typescript
import {
  GetSharpPipelineArgs,
  SharpConfig,
  getDefaultSharpPipeline,
} from "openimg/bun";
import sharp from "sharp";

export function getSharpPipeline({
  params,
  source,
}: GetSharpPipelineArgs): SharpConfig | undefined {
  const url = new URL(request.url);
  const blackAndWhite = url.searchParams.get("bw") === "true";

  if (blackAndWhite) {
    // Start with the default pipeline and add black & white conversion
    const pipeline = getDefaultSharpPipeline(params).greyscale();

    return {
      pipeline,
      cacheKey: `${getCacheKeyFromSource(source)}-bw`, // Unique cache key
    };
  }

  // Use default pipeline for other cases
  return undefined;
}

// Helper function to get cache key from source
function getCacheKeyFromSource(source: ImgSource): string {
  if (source.type === "fs") return source.path;
  if (source.type === "fetch") return source.url;
  return source.cacheKey; // custom cacheKey when source.type === "data"
}
```

##### Example for custom quality and sharpening:

```typescript
import { GetSharpPipelineArgs, SharpConfig } from "openimg/bun";
import sharp from "sharp";

export function getSharpPipeline({
  params,
  source,
}: GetSharpPipelineArgs): SharpConfig {
  const pipeline = sharp().autoOrient();

  // Custom resize with lanczos3 kernel for better quality
  if (params.width && params.height) {
    pipeline.resize(params.width, params.height, {
      fit: params.fit,
      kernel: sharp.kernel.lanczos3,
    });
  }

  // Add sharpening
  pipeline.sharpen();

  // Custom format with specific quality
  if (params.format === "webp") {
    pipeline.webp({ quality: 90 });
  } else if (params.format === "avif") {
    pipeline.avif({ quality: 85 });
  }

  return {
    pipeline,
    // Unique cache key for this specific image source + specific custom sharp pipeline
    cacheKey: `${getCacheKeyFromSource(source)}-hq`, // High quality variant
  };
}
```

You then pass the custom `getSharpPipeline` function to `getImgResponse`:

```typescript
getImgResponse(request, { getSharpPipeline });
```

## getDefaultSharpPipeline

The `getDefaultSharpPipeline` helper function is also exported and can be used as a starting point for custom pipelines:

```typescript
import { getDefaultSharpPipeline } from "openimg/bun";

const defaultPipeline = getDefaultSharpPipeline(params);
// defaultPipeline already includes autoOrient(), resize(), and format conversion

// Extend the default pipeline
const customPipeline = defaultPipeline.blur(2).tint({ r: 255, g: 240, b: 16 });
```

The default pipeline applies:

1. Auto-orientation based on EXIF data
2. Resizing (if width and height are specified)
3. Format conversion (webp, avif, png, jpeg)

## getImgPlaceholder

Import `getImgPlaceholder` from `openimg/bun` and pass in a Readable stream (like `ReadStream`), a ReadableStream, or image Buffer. The function will return a low quality image placeholder as a base64-encoded string using [thumbhash](https://github.com/evanw/thumbhash). The generated string can be stored in a database or inlined in your client bundle as a placeholder until the full image is loaded.

##### Example using a Readable stream:

```typescript
import { getImgPlaceholder } from "openimg/bun";
import { createReadStream } from "node:fs";

const stream = createReadStream("./public/cat.png");
const placeholder = await getImgPlaceholder(stream);
console.log(placeholder); // data:image/png;base64,...
```

##### Example using a ReadableStream:

```typescript
import { getImgPlaceholder } from "openimg/bun";

const response = await fetch("https://example.com/cat.png");
const readableStream = response.body;
const placeholder = await getImgPlaceholder(readableStream);
console.log(placeholder); // data:image/png;base64,...
```

##### Example using an image Buffer:

```typescript
import { getImgPlaceholder } from "openimg/bun";
import { readFileSync } from "node:fs";

const buffer = createReadStream("./public/cat.png");
const placeholder = await readFileSync(buffer);
console.log(placeholder); // data:image/png;base64,...
```

## getImgMetadata

`getImgMetadata` returns the width, height, and format of an image. The width and height parameters correspond to the auto-oriented version of the image taking the EXIF tag into account (see [sharp autoOrient](https://sharp.pixelplumbing.com/api-operation/#autoorient)).

Import `getImgMetadata` from `openimg/bun` and pass in a Readable stream (like `ReadStream`), a ReadableStream, or image Buffer. The function will return the width, height, and format of the image.

##### Example using a Readable stream:

```typescript
import { getImgMetadata } from "openimg/bun";
import { createReadStream } from "node:fs";

const stream = createReadStream("./public/cat.png");
const metadata = await getImgMetadata(stream);
console.log(metadata); // { width: 300, height: 300, format: "png" }
```

##### Example using a ReadableStream:

```typescript
import { getImgMetadata } from "openimg/bun";

const response = await fetch("https://example.com/cat.png");
const readableStream = response.body;
const metadata = await getImgMetadata(readableStream);
console.log(metadata); // { width: 300, height: 300, format: "png" }
```

##### Example using an image Buffer:

```typescript
import { getImgMetadata } from "openimg/bun";
import { readFileSync } from "node:fs";

const buffer = readFileSync("./public/cat.png");
const metadata = await getImgMetadata(buffer);
console.log(metadata); // { width: 300, height: 300, format: "png" }
```
