# openimg-node

openimg-node (Open Image Node) provides an HTTP request handler function to optimize images using sharp.

## Installation

```bash
npm i sharp openimg-node
```

openimg-node uses [sharp](https://sharp.pixelplumbing.com) and can only be used in environments that can run sharp (and [libvips](https://github.com/libvips/libvips)).

## Considerations

Currently, there is only a "web" version of this package, using the HTTP `Request` and `Response` objects (web globals). This will be annyoing to work with if you are using Express or another Node library that operates on `IncomingMessage` and `ServerResponse` objects or similar.

## Usage

Import `getImgResponse` from `openimg-node` and pass in the HTTP `Request` object. The function will return an HTTP `Response` object with the optimized image.

Simple example using Hono:

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

export default app;
```

By default, `getImgResponse` will source images from the `./public` directory and cache files to `./data/img`. You can change this via the config options, including allowlisting remote origins. Add a `public` folder to the root folder with an image (png, jpg), e.g., `cat.png` and visit `http://localhost:3000?src=cat.png&w=300&h=300&format=avif&fit=cover` to see the optimized image. Only the `src` parameter is required. All other parameters are optional.

The following search parameters are supported by default:

- `src`: The source image. This can be a local file path (relative to the `publicFolder`) or a full URL. If it is a full URL, the image will be fetched from the origin. If it is a local file path, the image will be read from the file system.
- `w` (optional, defaults to src image width): The width of the image.
- `h` (optional, defaults to src image height): The height of the image.
- `fit` (optional, defaults to 'cover'): The fit mode of the image.
- `format` (optional, defaults to src image format): The target format of the image.

### Config options

#### headers

Headers to be added to the HTTP response.

```typescript
const headers = new Headers();
headers.set("Cache-Control", "public, max-age=31536000, immutable");
return getImgResponse(c.req.raw, { headers });
```

Note, that `getImgResponse` will only set the `Content-Type` header for avif and webp images. All other headers (e.g., `Cache-Control`) must be set manually. This is to allow for more flexibility in how you want to handle caching. In most cases, you probably want to enforce unique file names and set an aggressive cache policy. It is also recommended to use a CDN in front of your image server.

### cacheFolder

Default: `./data/img`. The folder to cache optimized images to. Can be set to either a string path or `no_cache` to not cache to disk.

```typescript
const headers = new Headers();
headers.set("Cache-Control", "public, max-age=31536000, immutable");
return getImgResponse(c.req.raw, { headers, cacheFolder: 'no_cache' });
```

If you set `cacheFolder` to `no_cache`, the optimized image will not be cached to disk. This is useful for serverless environments or when you want to cache the image only via a CDN.

Note, `getImgSources` can be used to implement custom path logic based on the `Request` object. If `getImgSources` is set, then setting `cacheFolder` will have no effect, as `getImgSources` will return the `cacheSrc` and `originSrc` values.

#### publicFolder

Default: `./public`. The folder to source images from. Can be set to either a string path or `no_public` to not permit relative src paths.

```typescript
getImgResponse(c.req.raw, { cacheFolder: './cache', publicFolder: './dist/public' });
```

Note, `getImgSources` can be used to implement custom path logic based on the `Request` object. If `getImgSources` is set, then setting `cacheFolder` will have no effect, as `getImgSources` will return the `cacheSrc` and `originSrc` values.

#### allowlistedOrigins

Default: `[]`. List of allowed origins. If empty, only relative pathnames are allowed (e.g., `/cat.png`) for local images hosted on the server. If set, `getImgResponse` will fetch the image from the origin when `src` is a full URL. Relative URLs are still resolved relative to the `publicFolder`.

```typescript
getImgResponse(c.req.raw, { allowlistedOrigins: ['https://example.com', 'http://localhost:3000'] });
```

Note, if `getImgSources` is set, `allowlistedOrigins` has no effect. Instead, you have to enforce the allowlist yourself (e.g., return a `Response` with a 403 status code if the origin is not allowed).

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

By default, `getImgParams` will use the search parameters of the request to determine the image parameters. However, for more flexibility, you can implement your own logic to determine the image parameters.

#### getImgSources

Default: `undefined`. A function that takes a `Request` object and an `ImgParams` object and returns an `ImgSources` object or a `Response` object. If it returns a `Response` object, the response will be returned as-is. Otherwise, the returned image sources will be used to retrieve the source image and to store/cache the optimized image. If `cacheSrc` is set to `no_cache`, the source image will not be cached on the server. This is useful for serverless environments or when you want to cache the image only via a CDN.

`ImgSources` type:

```typescript
type ImgSources = {
  cacheSrc: string | null;
  originSrc: string;
};
```

By default, `getImgSources` will resolve the `src` search parameter relative to the `publicFolder` and cache the optimized image to `./data/img`.
