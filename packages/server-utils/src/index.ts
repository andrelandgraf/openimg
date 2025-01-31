import path from "node:path";

const FORMATS = ["webp", "avif", "png", "jpeg", "jpg"] as const;
export type Format = (typeof FORMATS)[number];

const FITS = ["cover", "contain"] as const;
export type Fit = (typeof FITS)[number];

export type ImgParams = {
  width?: number | undefined;
  height?: number | undefined;
  fit?: Fit | undefined;
  targetFormat?: Format | undefined;
};

export type ImgSources = {
  cacheSrc: string;
  originSrc: string;
};

export type GetImgParams = (request: Request) => ImgParams | Response;

export type GetImgSources = (request: Request, params: ImgParams, config: {
  publicFolderPath: string,
  allowlistedOrigins: string[],
}) => ImgSources | Response;

/**
 * - responseHeaders: Headers to be added to the response. Note that no caching headers will be added automatically.
 * - publicFolderPath: Default: "./public". Use getImgSources if you need more control
 * - allowlistedOrigins: Default: []. List of allowed origins. If empty, only pathnames are allowed (e.g., /cat.png). Example allowlist: ['example.com', 'example.com:3000']
 * - getImgParams: Customize where to get img params
 * - getImgSources: Customize where to get img sources.
 */
export type Config = {
  responseHeaders?: Headers;
  publicFolderPath?: string; // default: "./public".
  allowlistedOrigins?: string[]; // default: []
  getImgParams?: GetImgParams;
  getImgSources?: GetImgSources;
};

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

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

export const getImgParams: GetImgParams = (request) => {
  const url = new URL(request.url);
  const w = url.searchParams.get("w") || undefined;
  assert(
    (w && !Number.isNaN(w)) || !w,
    'Search param "w" must be a either number or unset',
  );
  const width = w ? Number.parseInt(w, 10) : undefined;

  const h = url.searchParams.get("h") || undefined;
  assert(
    (h && !Number.isNaN(h)) || !h,
    'Search param "h" must be either a number or unset',
  );
  const height = h ? Number.parseInt(h, 10) : undefined;

  const fit = url.searchParams.get("fit") || undefined;
  assert(
    isFitValue(fit),
    `Search param "fit" must be one of ${FITS.join(", ")} or unset`,
  );

  const targetFormat = url.searchParams.get("format") || undefined;
  assert(
    isFormatValue(targetFormat),
    `Target format must be one of ${FORMATS.join(", ")} or unset`,
  );

  return {
    width,
    height,
    targetFormat,
    fit,
  };
}

export const getImgSources: GetImgSources = (request, params, config) => {
  const url = new URL(request.url);
  const originSrc = url.searchParams.get("src"); // "https://example.com/folder/cat.png", "/cat.png"
  assert(!!originSrc, "origin src must be a valid path");

  const originUrl = isUrl(originSrc) ? new URL(originSrc) : null;
  const host = originUrl ? originUrl.hostname : ""; // "example.com", ""
  if(originUrl && !config.allowlistedOrigins.includes(host)) {
    return new Response(`Origin ${host} not in allowlist`, { status: 403 });
  }

  const originPath = originUrl ? originUrl.pathname : originSrc; // "/folder/cat.png", "/cat.png"
  const originExtension = path.extname(originPath); // ".png"
  const fileNameNoExt = path.basename(originPath, originExtension); // "/cat"
  const extension = params.targetFormat
    ? "." + params.targetFormat
    : originExtension;
  assert(!!fileNameNoExt, "file name must be a valid file name");

  let idPath = host + originPath; // "example.com/folder/cat.png", "/cat.png"
  idPath = idPath.startsWith("/") ? idPath : '/' + idPath; // "/example.com/folder/cat.png", "/cat.png"
  idPath = idPath.replaceAll(".", "-");
  idPath = idPath.replaceAll(":", "-");
  const cacheSrc = "./data/images" + idPath + `-w-${params.width || "base"}-h-${params.height || "base"}-fit-${params.fit || "base"}` + extension;

  return {
    cacheSrc,
    originSrc: originUrl ? originSrc : config.publicFolderPath + originSrc,
  };
}

export function isUrl(src: string) {
  try {
    new URL(src);
    return true;
  } catch {
    return false;
  }
}

