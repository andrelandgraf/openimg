import path from "node:path";

const FORMATS = ["webp", "avif", "png", "jpeg", "jpg"] as const;
export type Format = (typeof FORMATS)[number];

const FITS = ["cover", "contain"] as const;
export type Fit = (typeof FITS)[number];

/**
 * ImgParams specifies the parameters for image processing.
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

/**
 * ImgSources specifies the original and cache sources
 * If the image is found in the cacheSrc, it will be streamed from there.
 * If the image is not found in the cacheSrc, it will be fetched from the originalSrc,
 * processed, and then stored in the cacheSrc, and then streamed from there.
 *
 * If cacheSrc is set to "no_cache, the image will not be cached. This is useful for serverless
 * environments that can't access the filesystem. In this case, you most likely want a CDN
 * in front of your server to cache the images.
 */
export type ImgSources = {
  originalSrc: string;
  cacheSrc: string | "no_cache";
};

/**
 * Called to get the target image parameters for a given request.
 * The default implementation reads the parameters w (width), h (height), fit, and format from the search parameters.
 */
export type GetImgParams = (request: Request) => ImgParams | Response;

/**
 * Called to get the sources for a given request.
 * The default implementation reads the parameters src (source) from the search parameters
 * to determine the originalSrc and cacheSrc. The default origin is mapped to "./public"
 * and the default cache to "./data/images".
 */
export type GetImgSources = (
  request: Request,
  params: ImgParams,
) => ImgSources | Response;

type ImgSourcesConfig = {
  cacheFolder?: string | "no_cache"; // default: "./data/images"
  publicFolder?: string | "no_public"; // default: "./public".
  allowlistedOrigins?: string[]; // default: []
};

/**
 * Configuration values for the getImgResponse function.
 * - headers: Headers to be added to the response. Note that no caching headers will be added automatically.
 * - cacheFolder: Default: ".data/images". Set to "no_cache" for no caching. Each request will fetch the original image and process it again.
 * - publicFolder: Default: "./public". Set to "no_public" for remote only origins. Use getImgSources if you need more control.
 * - allowlistedOrigins: Default: []. List of allowed origins. If empty, no remote origins will be allowed and only relative pathnames are permitted (e.g., /cat.png).
 *   Example allowlist: ['https://example.com', 'http://localhost:3000']
 *   Adding an '*' entry, ['*'], allows all remote origins.
 * - getImgParams: Provide a custom getImgParams function for more control over where to retrieve the image parameters from the request.
 * - getImgSources: Provide a custom getImgSources function for more control over allow list and mapping the request to the original and cache sources
 */
export type Config = {
  headers?: Headers;
  getImgParams?: GetImgParams;
  getImgSources?: GetImgSources;
} & ImgSourcesConfig;

function isFitValue(fit: string | undefined): fit is Fit | undefined {
  if (fit === undefined) {
    return true;
  }
  return (FITS as any as string[]).includes(fit);
}

function isFormatValue(
  format: string | undefined,
): format is Format | undefined {
  if (format === undefined) {
    return true;
  }
  return (FORMATS as any as string[]).includes(format);
}

export function getImgParams(request: Request): ImgParams | Response {
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
      statusText: `Search param "fit" must be one of ${FITS.join(", ")} or unset`,
    });
  }

  let format = url.searchParams.get("format") || undefined;
  if (!isFormatValue(format)) {
    return new Response(null, {
      status: 400,
      statusText: `Search param "format" must be one of ${FORMATS.join(", ")} or unset`,
    });
  }

  return {
    width,
    height,
    format,
    fit,
  };
}

export function getImgSources(
  request: Request,
  params: ImgParams,
  config: ImgSourcesConfig,
): ImgSources | Response {
  const allowlistedOrigins = config.allowlistedOrigins || [];
  const publicFolder = config.publicFolder || "./public";
  const cacheFolder = config.cacheFolder || "./data/images";
  if (publicFolder === "no_public" && !allowlistedOrigins.length) {
    return new Response(null, {
      status: 500,
      statusText:
        'At least one remote origin must be allowlisted if "no_public" is set',
    });
  }

  const url = new URL(request.url);
  const src = url.searchParams.get("src"); // "https://example.com/folder/cat.png", "/cat.png"
  if (!src) {
    return new Response(null, {
      status: 400,
      statusText: 'Search param "src" must be set',
    });
  }

  const srcUrl = parseUrl(src);
  if (!srcUrl && publicFolder === "no_public") {
    return new Response(null, {
      status: 403,
      statusText: "Relative src not allowed",
    });
  }

  const allAllowed = allowlistedOrigins.includes("*");
  if (!allAllowed && srcUrl && !allowlistedOrigins.includes(srcUrl.origin)) {
    return new Response(null, {
      status: 403,
      statusText: `Origin ${srcUrl.origin} not in allowlist`,
    });
  }

  const originalSrc = srcUrl ? src : publicFolder + src;
  if (cacheFolder === "no_cache") {
    return {
      originalSrc,
      cacheSrc: "no_cache",
    };
  }

  const srcPath = srcUrl ? srcUrl.pathname : src; // "/folder/cat.png", "/cat.png"
  const originExtension = path.extname(srcPath); // ".png"
  const extension = params.format ? "." + params.format : originExtension;

  const host = srcUrl ? srcUrl.hostname : ""; // "example.com", ""
  let slug = host + srcPath; // "example.com/folder/cat.png", "/cat.png"
  slug = slug.startsWith("/") ? slug : "/" + slug; // "/example.com/folder/cat.png", "/cat.png"
  slug = slug.replaceAll(".", "-");
  slug = slug.replaceAll(":", "-");
  const cacheSrc =
    cacheFolder +
    slug +
    `-w-${params.width || "base"}-h-${params.height || "base"}-fit-${params.fit || "base"}` +
    extension;

  return {
    originalSrc,
    cacheSrc,
  };
}

export function parseUrl(src: string) {
  try {
    return new URL(src);
  } catch {
    return false;
  }
}

export class PipelineLock {
  pipelines = new Map<string, { p: Promise<void>; resolve: () => void }>();

  get(originalSrc: string) {
    const pipeline = this.pipelines.get(originalSrc);
    if (pipeline) {
      return pipeline.p;
    }
    return null;
  }

  add(originalSrc: string) {
    let resolve: () => void;
    const p = new Promise<void>((r) => {
      resolve = r;
    });
    this.pipelines.set(originalSrc, { p, resolve: resolve! });
  }

  resolve(originalSrc: string) {
    const pipeline = this.pipelines.get(originalSrc);
    if (!pipeline) {
      throw new Error("Trying to resolve a non-existing pipeline");
    }
    pipeline.resolve();
    this.pipelines.delete(originalSrc);
  }
}
