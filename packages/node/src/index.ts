import path from "node:path";
import fs from "node:fs";
import fsp from "node:fs/promises";
import { createReadStream, ReadStream } from "fs";
import { Readable } from "node:stream";
import sharp from "sharp";

const FORMATS = ["webp", "avif", "png", "jpeg", "jpg"] as const;
type Format = (typeof FORMATS)[number];

const FITS = ["cover", "contain"] as const;
type Fit = (typeof FITS)[number];

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

export type Config = {
  getImgParams?: (request: Request) => ImgParams | Response;
  getImgSources?: (
    request: Request,
    params: ImgParams,
  ) => ImgSources | Response;
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

function getImgParams(request: Request): ImgParams {
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

function getImgSources(request: Request, params: ImgParams): ImgSources {
  const url = new URL(request.url);
  const endpointPath = "/img";
  const remainingPath = url.pathname.slice(endpointPath.length); // "/funny/cat.webp"
  const originSrc = "./public" + remainingPath;
  assert(!!originSrc, "origin src must be a valid path");

  const originPath = path.dirname(remainingPath); // "/funny", "/"
  const fileNameNoExt = path.basename(originSrc, path.extname(originSrc)); // "/cat"
  const extension = params.targetFormat
    ? "." + params.targetFormat
    : path.extname(originSrc);
  assert(!!fileNameNoExt, "file name must be a valid file name");
  const cacheSrc = `./data/images${originPath + fileNameNoExt}-w-${params.width || "base"}-h-${params.height || "base"}-fit-${params.fit || "base"}${extension}`;

  return {
    cacheSrc,
    originSrc,
  };
}

async function exists(path: string) {
  try {
    const stats = await fsp.stat(path);
    if (stats.size === 0) {
      return false;
    }
  } catch {
    return false;
  }
  return true;
}

function toWebStream(nodeStream: ReadStream) {
  return new ReadableStream({
    start(controller) {
      nodeStream.on("data", (chunk) => controller.enqueue(chunk));
      nodeStream.on("end", () => controller.close());
      nodeStream.on("error", (error) => controller.error(error));
    },
    cancel() {
      nodeStream.destroy();
    },
  });
}

function streamFromCache(path: string, headers: Headers) {
  const nodeStream = createReadStream(path);
  const webStream = toWebStream(nodeStream);
  return new Response(webStream, { headers });
}

function isUrl(src: string) {
  try {
    new URL(src);
    return true;
  } catch {
    return false;
  }
}

export async function getImgResponse(
  request: Request,
  headers = new Headers(),
  config?: Config,
) {
  let params: ImgParams;
  if (config?.getImgParams) {
    const res = config.getImgParams(request);
    if (res instanceof Response) {
      return res;
    }
    params = res;
  } else {
    // Use default getImgParams
    params = getImgParams(request);
  }

  let sources: ImgSources;
  if (config?.getImgSources) {
    const res = config.getImgSources(request, params);
    if (res instanceof Response) {
      return res;
    }
    sources = res;
  } else {
    // Use default getImgSources
    sources = getImgSources(request, params);
  }

  if (await exists(sources.cacheSrc)) {
    return streamFromCache(sources.cacheSrc, headers);
  }

  let nodeStream: Readable;
  if (isUrl(sources.originSrc)) {
    const fetchRes = await fetch(sources.originSrc);
    if (!fetchRes.ok || !fetchRes.body) {
      return new Response(fetchRes.statusText || "Image not found", {
        status: fetchRes.status || 404,
      });
    }
    nodeStream = Readable.fromWeb(fetchRes.body as any);
  } else {
    if (!(await exists(sources.originSrc))) {
      return new Response("Image not found", { status: 404 });
    }
    nodeStream = createReadStream(sources.originSrc);
  }

  const pipeline = sharp();
  if (params.targetFormat === "avif") {
    pipeline.avif();
    headers.set("content-type", "image/avif");
  } else if (params.targetFormat === "webp") {
    pipeline.webp();
    headers.set("content-type", "image/webp");
  }

  if (params.width && params.height) {
    pipeline.resize(params.width, params.height, { fit: params.fit });
  }

  fsp
    .mkdir(path.dirname(sources.cacheSrc), { recursive: true })
    .catch(() => {});

  await new Promise<void>((resolve, reject) => {
    const writeStream = fs.createWriteStream(sources.cacheSrc);
    nodeStream
      .pipe(pipeline)
      .on("error", reject)
      .pipe(writeStream)
      .on("error", reject)
      .on("finish", resolve);
  });

  return streamFromCache(sources.cacheSrc, headers);
}
