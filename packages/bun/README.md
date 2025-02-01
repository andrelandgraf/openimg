# openimg-bun

openimg-bun (Open Image Bun) provides an HTTP request handler function (`getImgResponse`) to optimize images using sharp, using Bun APIs where possible. It also provides a standalone HTTP server executable via `bunx`. The standalone server can be deployed via Docker or wherever bun can run natively.

## Standalone server

To run the standalone server, run the following command:

```bash
ENV=production bunx openimg-linux-64
# or
ENV=production bunx openimg-arm-64
# or
ENV=production bunx openimg-windows-64
# or
ENV=production bunx openimg-darwin-64
# or
ENV=production bunx openimg-darwin-arm64
```

You can further provide a `config.json` file in the root folder to configure the server. The config file is a JSON file with the following options:

- `host`: The host to listen on. Default: `localhost`.
- `port`: The port to listen on. Default: `3000`.
- `publicFolderPath`: The folder to source images from. Default: `./public`.
- `allowlistedOrigins`: List of allowed origins. If empty, only pathnames are allowed (e.g., `/cat.png`). Example allowlist: `['example.com', 'example.com:3000']`

Add a `public` folder to the root folder with an image (png, jpg), e.g., `img.png` and run visit `http://localhost:3000?src=img.png&w=300&h=300&format=avif` to see the optimized image.

## HTTP request handler

### Installation

```bash
npm i sharp openimg-bun
```

openimg-bun uses [sharp](https://sharp.pixelplumbing.com) and can only be used in environments that can run sharp (and [libvips](https://github.com/libvips/libvips)).

### Usage

Import `getImgResponse` from `openimg-node` and pass in the HTTP `Request` object. The function will return an HTTP `Response` object with the optimized image.

```typescript
import { Hono } from "hono";
import { getImgResponse } from "openimg-node";

const app = new Hono();

app.get("/img", (c) => {
  const headers = new Headers();
  headers.set("Cache-Control", "public, max-age=31536000, immutable");
  const config = { headers };
  return getImgResponse(c.req.raw, config);
});
```

By default, `getImgResponse` will source images from the `./public` directory and cache files to `./data/img`. You can change this via the config options. 

### Config options

#### headers

Headers to be added to the response. The `Content-Type` header will be appended by `getImgResponse`. Note that no other headers will be added.

#### Caching & CDNs

Note, that `getImgResponse` will only set the `Content-Type` header. All other headers (e.g. `Cache-Control`) must be set manually. This is to allow for more flexibility in how you want to handle caching.
In most cases, you probably want to enforce unique file names and set an aggressive cache policy. It is also recommended to use a CDN in front of your image server.

#### publicFolderPath

Default: `./public`. The folder to source images from. This is only used if `getImgSources` is not set.

#### allowlistedOrigins

Default: `[]`. List of allowed origins. If empty, only pathnames are allowed (e.g., `/cat.png`). Example allowlist: `['example.com', 'example.com:3000']`

#### getImgParams

Default: `undefined`. A function that takes a `Request` object and returns an `ImgParams` object or a `Response` object. If it returns a `Response` object, the response will be returned as-is.

#### getImgSources

Default: `undefined`. A function that takes a `Request` object and an `ImgParams` object and returns an `ImgSources` object or a `Response` object. If it returns a `Response` object, the response will be returned as-is.