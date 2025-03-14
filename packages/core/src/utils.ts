import path from "node:path";
import { ReadStream } from "node:fs";
import { Readable } from "node:stream";

const FORMATS = ["webp", "avif", "png", "jpeg", "jpg"] as const;
export type Format = (typeof FORMATS)[number];

const FITS = ["cover", "contain"] as const;
export type Fit = (typeof FITS)[number];

export const DEFAULT_CACHE_FOLDER = "./data/images";

/**
 * ImgParams are the image optimization parameters from the incoming request
 * - width: The target width of the image. If not set, the original image's width will be used.
 * - height: The target height of the image. If not set, the original image's height will be used.
 * - fit: The fit mode for resizing the image: "cover" or "contain". Defaults to sharp's default "cover".
 * - format: The target format of the image: "webp", "avif", "png", "jpeg", or "jpg". If not specified, the format will be inferred from the source.
 */
export type ImgParams = {
  width?: number | undefined;
  height?: number | undefined;
  fit?: Fit | undefined;
  format?: Format | undefined;
};

export type GetImgParamsArgs = { request: Request };

/**
 * Called to get the image parameters for an incoming HTTP request.
 * The default implementation reads the parameters src, w (width), h (height), fit, and format from the search parameters.
 */
export type GetImgParams = (
  args: GetImgParamsArgs
) => Promise<ImgParams | Response> | ImgParams | Response;

/**
 * ImgData is the response body (ReadableStream), buffer, or other readable representation of an image.
 */
export type ImgData =
  | ReadableStream<Uint8Array<ArrayBufferLike>>
  | Readable
  | Buffer<ArrayBufferLike>
  | Uint8Array<ArrayBufferLike>;

/**
 * ImgSource describes where and how to retrieve the original image.
 * - type: The type of the source, either "fs" for local file system, "fetch" for remote URL, or "data" for supplying the image data directly.
 * - path: The path to the image if type is "fs".
 * - url: The URL to fetch the image from if type is "fetch", can be a relative path or an absolute URL.
 * - headers: Optional headers to be sent with the fetch request if type is "fetch".
 * - data: The image data if type is "data".
 * - cacheKey: If you provide custom image data and want the image to be cached, you need to provide your own cache key because there is no path or url to generate a cache key from.
 */
export type ImgSource =
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

export type GetImgSourceArgs = { request: Request; params: ImgParams };

/**
 * Called to get the source of the original image for a given request.
 * The default implementation uses the src ImgParams value to determine the source:
 * - If the src is a relative path, it is assumed to be a local file path and concatenated with './public'.
 * - If the src is an absolute URL, it is assumed to be a remote image.
 * Implement this function to customize the source retrieval logic.
 */
export type GetImgSource = (
  args: GetImgSourceArgs
) => Promise<ImgSource | Response> | ImgSource | Response;

/**
 * Configuration values for the getImgResponse function.
 * - headers: Headers to be added to the response. Note that no caching headers will be added automatically.
 * - cacheFolder: Default: ".data/images". Set to "no_cache" for no caching.
 * - allowlistedOrigins: Default: []. List of allowed origins. If empty, no remote origins will be allowed and only relative pathnames are permitted (e.g., /cat.png).
 *   Example allowlist: ['https://example.com', 'http://localhost:3000']
 *   Adding an '*' entry, ['*'], allows all remote origins.
 * - getImgSource: Provide a custom getImgSource function to map the request to a source path or url to the retrieve the original image.
 * - getImgParams: Provide a custom getImgParams function for more control over where to retrieve the image parameters from the request.
 */
export type Config = {
  headers?: HeadersInit;
  allowlistedOrigins?: string[]; // default: []
  getImgParams?: GetImgParams;
  getImgSource?: GetImgSource;
  cacheFolder?: string | "no_cache"; // default: "./data/images"
};

export function fromWebStream(stream: ReadableStream): Readable {
  return Readable.fromWeb(stream as any);
}

export function toWebStream(readable: Readable | ReadStream): ReadableStream {
  return Readable.toWeb(readable) as any as ReadableStream;
}

function isFitValue(fit: string | undefined): fit is Fit | undefined {
  if (fit === undefined) {
    return true;
  }
  return (FITS as any as string[]).includes(fit);
}

function isFormatValue(
  format: string | undefined
): format is Format | undefined {
  if (format === undefined) {
    return true;
  }
  return (FORMATS as any as string[]).includes(format);
}

export function getImgParams({
  request,
}: GetImgParamsArgs): ImgParams | Response {
  const url = new URL(request.url);

  const w = url.searchParams.get("w") || undefined;
  if (w && Number.isNaN(w)) {
    return new Response(null, {
      status: 400,
      statusText: 'Search param "w" must be either a number or unset',
    });
  }
  const width = w ? Number.parseInt(w, 10) : undefined;

  const h = url.searchParams.get("h") || undefined;
  if (h && Number.isNaN(h)) {
    return new Response(null, {
      status: 400,
      statusText: 'Search param "h" must be either a number or unset',
    });
  }
  const height = h ? Number.parseInt(h, 10) : undefined;

  const fit = url.searchParams.get("fit") || undefined;
  if (!isFitValue(fit)) {
    return new Response(null, {
      status: 400,
      statusText: `Search param "fit" must be one of ${FITS.join(
        ", "
      )} or unset`,
    });
  }

  let format = url.searchParams.get("format") || undefined;
  if (!isFormatValue(format)) {
    return new Response(null, {
      status: 400,
      statusText: `Search param "format" must be one of ${FORMATS.join(
        ", "
      )} or unset`,
    });
  }

  return {
    width,
    height,
    format,
    fit,
  };
}

type GetCachePathArgs = {
  params: ImgParams;
  source: ImgSource;
  cacheFolder?: string | undefined | null;
};

function getCacheKey(source: ImgSource) {
  if (source.type === "fs") {
    return source.path;
  }
  if (source.type === "fetch") {
    return source.url;
  }
  return source.cacheKey;
}

export function getCachePath({
  params,
  source,
  cacheFolder = DEFAULT_CACHE_FOLDER,
}: GetCachePathArgs): string {
  const src = getCacheKey(source); // "https://example.com/folder/cat.png", "/cat.png"
  invariant(src, "Invalid source"); // We should have errored in validateImgSource if there was no cacheKey
  const srcUrl = source.type === "fetch" ? new URL(src) : null;
  let srcPath = srcUrl ? srcUrl.pathname : src; // "/folder/cat.png", "/cat.png"
  const originExtension = path.extname(srcPath); // ".png"
  const extension = params.format ? "." + params.format : originExtension;

  const host = srcUrl ? srcUrl.hostname : ""; // "example.com", ""
  let slug = host + srcPath; // "example.com/folder/cat.png", "/cat.png"
  slug = slug.startsWith("/") ? slug : "/" + slug; // "/example.com/folder/cat.png", "/cat.png"
  slug = slug.endsWith("/") ? slug.slice(0, -1) : slug;
  slug = slug.replaceAll(".", "-");
  slug = slug.replaceAll(":", "-");
  slug = slug.replaceAll("//", "/");
  slug = slug.replaceAll("/-/", "/");
  return (
    cacheFolder +
    slug +
    `-w-${params.width || "base"}-h-${params.height || "base"}-fit-${
      params.fit || "base"
    }` +
    extension
  );
}

export function getImgSource({
  request,
}: GetImgSourceArgs): ImgSource | Response {
  const url = new URL(request.url);
  const src = url.searchParams.get("src"); // "https://example.com/folder/cat.png", "/cat.png"
  if (!src) {
    return new Response(null, {
      status: 400,
      statusText: 'Search param "src" must be set',
    });
  }
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

export function validateImgSource(
  source: ImgSource,
  config: Config
): Response | null {
  if (source.type === "fs") {
    // nothing to validate for file system sources
    return null;
  }
  if (source.type === "data") {
    if (config.cacheFolder !== "no_cache" && !source.cacheKey) {
      throw new Error(
        'Caching is enabled but getImgSource did not return a ImgSource cacheKey. Set cacheFolder to no_cache or provide a unique cacheKey as part of type "data" ImgSource.'
      );
    }
    return null;
  }
  const allowlistedOrigins = config.allowlistedOrigins || [];
  const allAllowed = allowlistedOrigins.includes("*");
  if (allAllowed) {
    return null;
  }
  const srcUrl = parseUrl(source.url);
  if (!srcUrl) {
    // relative path (e.g., /cat.png) always allowed
    return null;
  }
  if (!allowlistedOrigins.includes(srcUrl.origin)) {
    return new Response(null, {
      status: 403,
      statusText: `Origin ${srcUrl.origin} not in allowlist`,
    });
  }
  return null;
}

export function parseUrl(src: string) {
  if (!URL.canParse(src)) {
    return false;
  }
  return new URL(src);
}

export class PipelineLock {
  pipelines = new Map<string, { p: Promise<void>; resolve: () => void }>();

  get(cacheSrc: string) {
    const pipeline = this.pipelines.get(cacheSrc);
    if (pipeline) {
      return pipeline.p;
    }
    return null;
  }

  add(cacheSrc: string) {
    let resolve: () => void;
    const p = new Promise<void>((r) => {
      const timeout = setTimeout(() => {
        this.resolve(cacheSrc);
      }, 10000); // kill lock after 10 seconds
      resolve = () => {
        clearTimeout(timeout);
        r();
      };
    });
    this.pipelines.set(cacheSrc, { p, resolve: resolve! });
  }

  resolve(cacheSrc: string | null) {
    if (!cacheSrc) {
      return;
    }
    const pipeline = this.pipelines.get(cacheSrc);
    if (pipeline) {
      pipeline.resolve();
      this.pipelines.delete(cacheSrc);
    }
  }
}

// invariant copied from https://github.com/alexreardon/tiny-invariant
/**
 * `invariant` is used to [assert](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-7.html#assertion-functions) that the `condition` is [truthy](https://github.com/getify/You-Dont-Know-JS/blob/bdbe570600d4e1107d0b131787903ca1c9ec8140/up%20%26%20going/ch2.md#truthy--falsy).
 *
 * 💥 `invariant` will `throw` an `Error` if the `condition` is [falsey](https://github.com/getify/You-Dont-Know-JS/blob/bdbe570600d4e1107d0b131787903ca1c9ec8140/up%20%26%20going/ch2.md#truthy--falsy)
 *
 * 🤏 `message`s are not displayed in production environments to help keep bundles small
 *
 * @example
 *
 * ```ts
 * const value: Person | null = { name: 'Alex' };
 * invariant(value, 'Expected value to be a person');
 * // type of `value`` has been narrowed to `Person`
 * ```
 */
export default function invariant(
  condition: any,
  // Not providing an inline default argument for message as the result is smaller
  /**
   * Can provide a string, or a function that returns a string for cases where
   * the message takes a fair amount of effort to compute
   */
  message?: string | (() => string)
): asserts condition {
  const isProduction: boolean = process.env.NODE_ENV === "production";
  const prefix: string = "Invariant failed";

  if (condition) {
    return;
  }
  // Condition not passed

  // In production we strip the message but still throw
  if (isProduction) {
    throw new Error(prefix);
  }

  // When not in production we allow the message to pass through
  // *This block will be removed in production builds*

  const provided: string | undefined =
    typeof message === "function" ? message() : message;

  // Options:
  // 1. message provided: `${prefix}: ${provided}`
  // 2. message not provided: prefix
  const value: string = provided ? `${prefix}: ${provided}` : prefix;
  throw new Error(value);
}

export function getContentType(format: Format | undefined | string): string {
  switch (format) {
    case "webp":
      return "image/webp";
    case "avif":
    case "heif":
      return "image/avif";
    case "png":
      return "image/png";
    case "jpeg":
    case "jpg":
    default:
      return "image/jpeg";
  }
}
