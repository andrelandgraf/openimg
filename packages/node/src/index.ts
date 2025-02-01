import path from "node:path";
import fs from "node:fs";
import fsp from "node:fs/promises";
import { createReadStream, ReadStream } from "fs";
import { Readable } from "node:stream";
import sharp from "sharp";
import type { ImgParams, ImgSources, Config } from "openimg-server-utils";
import { getImgParams, getImgSources, isUrl } from "openimg-server-utils";

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

function toWebStreamFromReadable(readable: Readable) {
  return new ReadableStream({
    start(controller) {
      readable.on("data", (chunk) => controller.enqueue(chunk));
      readable.on("end", () => controller.close());
      readable.on("error", (error) => controller.error(error));
    },
    cancel() {
      readable.destroy();
    },
  });
}

function streamFromCache(path: string, headers: Headers) {
  const nodeStream = createReadStream(path);
  const webStream = toWebStream(nodeStream);
  return new Response(webStream, { headers });
}

/**
 * @param request - the incoming HTTP request
 * @param config - the config object
 * @returns - a Response object
 */
export async function getImgResponse(request: Request, config?: Config) {
  const headers = config?.headers || new Headers();
  const configValues = {
    publicFolderPath: config?.publicFolderPath || "./public",
    allowlistedOrigins: config?.allowlistedOrigins || [],
  } as const;

  let params: ImgParams;
  if (config?.getImgParams) {
    const res = config.getImgParams(request);
    if (res instanceof Response) {
      return res;
    }
    params = res;
  } else {
    // Use default getImgParams
    const res = getImgParams(request);
    if (res instanceof Response) {
      return res;
    }
    params = res;
  }

  let sources: ImgSources;
  if (config?.getImgSources) {
    const res = config.getImgSources(request, params, configValues);
    if (res instanceof Response) {
      return res;
    }
    sources = res;
  } else {
    // Use default getImgSources
    const res = getImgSources(request, params, configValues);
    if (res instanceof Response) {
      return res;
    }
    sources = res;
  }

  if (sources.cacheSrc && (await exists(sources.cacheSrc))) {
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

  if (!!sources.cacheSrc) {
    await fsp
      .mkdir(path.dirname(sources.cacheSrc), { recursive: true })
      .catch(() => {});

    await new Promise<void>((resolve, reject) => {
      const writeStream = fs.createWriteStream(sources.cacheSrc!);
      nodeStream
        .pipe(pipeline)
        .on("error", reject)
        .pipe(writeStream)
        .on("error", reject)
        .on("finish", resolve);
    });

    return streamFromCache(sources.cacheSrc, headers);
  }
  return new Response(toWebStreamFromReadable(nodeStream.pipe(pipeline)), {
    headers,
  });
}
