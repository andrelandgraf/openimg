# openimg-bun

openimg-bun (Open Image Bun) provides an HTTP request handler function to optimize images using sharp, using Bun APIs where possible.

## Installation

```bash
npm i sharp openimg-bun
```

openimg-bun uses [sharp](https://sharp.pixelplumbing.com) and can only be used in environments that can run sharp (and [libvips](https://github.com/libvips/libvips)).

## Usage

Import `getImgResponse` from `openimg-bun` and pass in the HTTP `Request` object. The function will return an HTTP `Response` object with the optimized image.

```typescript
import { Hono } from "hono";
import { getImgResponse } from "openimg-bun";

const app = new Hono();

app.get("/img", (c) => {
  const headers = new Headers();
  headers.set("Cache-Control", "public, max-age=31536000, immutable");
  const config = { headers };
  return getImgResponse(c.req.raw, config);
});
```

By default, `getImgResponse` will source images from the `./public` directory and cache files to `./data/img`. You can change this via the config options. Add a `public` folder to the root folder with an image (png, jpg), e.g., `img.png` and visit `http://localhost:3000?src=img.png&w=300&h=300&format=avif&fit=cover` to see the optimized image. Only the `src` parameter is required. All other parameters are optional.

### Config options

#### headers

Headers to be added to the response.

#### Caching & CDNs

Note, that `getImgResponse` will only set the `Content-Type` header. All other headers (e.g. `Cache-Control`) must be set manually. This is to allow for more flexibility in how you want to handle caching.
In most cases, you probably want to enforce unique file names and set an aggressive cache policy. It is also recommended to use a CDN in front of your image server.

#### publicFolderPath

Default: `./public`. The folder to source images from. Note, `getImgSources` can be used to implement custom path logic based on the `Request` object. If `getImgSources` is set, then you can retrieve the `publicFolderPath` config option from the `config` object to resolve the public folder path.

#### allowlistedOrigins

Default: `[]`. List of allowed origins. If empty, only pathnames are allowed (e.g., `/cat.png`) for local images hosted on the server. Example allowlist: `['example.com', 'example.com:3000']`. If set,
`getImgResponse` will fetch the image from the origin when `src` is a full URL. Relative URLs are still resolved relative to the `publicFolderPath`. If `getImgSources` is set, then you can retrieve the `allowlistedOrigins` config option from the `config` object to enforce the allowlist yourself (e.g., return a `Response` with a 403 status code if the origin is not allowed).

#### getImgParams

Default: `undefined`. A function that takes a `Request` object and returns an `ImgParams` object or a `Response` object. If it returns a `Response` object, the response will be returned as-is. Otherwise, the returned image parameters will be used to optimize the image. This is useful if you want to implement custom logic based on the `Request` object.

`ImgParams` type:

```typescript
type ImgParams = {
  width?: number | undefined;
  height?: number | undefined;
  fit?: Fit | undefined;
  targetFormat?: Format | undefined;
};
```

By default, `getImgParams` will use the search parameters of the request to determine the image parameters. The following search parameters are supported:

- `src`: The source image. This can be a local file path (relative to the `publicFolderPath`) or a full URL. If it is a full URL, the image will be fetched from the origin. If it is a local file path, the image will be read from the file system.
- `w` (optional, defaults to src image width): The width of the image.
- `h` (optional, defaults to src image height): The height of the image.
- `fit` (optional, defaults to 'cover'): The fit mode of the image.
- `format` (optional, defaults to src image format): The target format of the image.

#### getImgSources

Default: `undefined`. A function that takes a `Request` object and an `ImgParams` object and returns an `ImgSources` object or a `Response` object. If it returns a `Response` object, the response will be returned as-is. Otherwise, the returned image sources will be used to retrieve the source image and to store/cache the optimized image. If `cacheSrc` is set to `null`, the source image will not be cached on the server. This is useful for serverless environments or when you want to cache the image only via a CDN.

`ImgSources` type:

```typescript
type ImgSources = {
  cacheSrc: string | null;
  originSrc: string;
};
```

By default, `getImgSources` will resolve the `src` search parameter relative to the `publicFolderPath` and cache the optimized image to `./data/img`.
