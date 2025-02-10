import path from "node:path";
import fs from "node:fs";
import fsp from "node:fs/promises";
import { createReadStream, ReadStream } from "fs";
import { Readable } from "node:stream";
import sharp from "sharp";
import {
  Config,
  getImgParams,
  getImgSources,
  ImgParams,
  ImgSources,
  parseUrl,
  PipelineLock,
} from "../utils";
import { exists } from "./utils";

const pipelineLock = new PipelineLock();

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
export async function getImgResponse(request: Request, config: Config = {}) {
  const headers = config.headers || new Headers();

  let params: ImgParams;
  if (config.getImgParams) {
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
  if ("getImgSources" in config && config.getImgSources) {
    const res = config.getImgSources(request, params);
    if (res instanceof Response) {
      return res;
    }
    sources = res;
  } else {
    // Use default getImgSources
    const res = getImgSources(request, params, {
      allowlistedOrigins: config.allowlistedOrigins,
      cacheFolder: config.cacheFolder,
      publicFolder: config.publicFolder,
    });
    if (res instanceof Response) {
      return res;
    }
    sources = res;
  }

  try {
    if (sources.cacheSrc !== "no_cache") {
      const lock = pipelineLock.get(sources.cacheSrc);
      if (lock) {
        await lock;
      }

      const fileInCache = await exists(sources.cacheSrc);
      if (fileInCache) {
        return streamFromCache(sources.cacheSrc, headers);
      }

      pipelineLock.add(sources.cacheSrc);
    }

    let nodeStream: Readable;
    if (parseUrl(sources.originalSrc)) {
      const fetchRes = await fetch(sources.originalSrc);
      if (!fetchRes.ok || !fetchRes.body) {
        pipelineLock.resolve(sources.cacheSrc);
        return new Response(fetchRes.statusText || "Image not found", {
          status: fetchRes.status || 404,
        });
      }
      nodeStream = Readable.fromWeb(fetchRes.body as any);
    } else {
      if (!(await exists(sources.originalSrc))) {
        pipelineLock.resolve(sources.cacheSrc);
        return new Response("Image not found", { status: 404 });
      }
      nodeStream = createReadStream(sources.originalSrc);
    }

    const pipeline = sharp();
    if (params.format === "avif") {
      pipeline.avif();
      headers.set("content-type", "image/avif");
    } else if (params.format === "webp") {
      pipeline.webp();
      headers.set("content-type", "image/webp");
    }

    if (params.width && params.height) {
      pipeline.resize(params.width, params.height, { fit: params.fit });
    }

    if (sources.cacheSrc !== "no_cache") {
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

      pipelineLock.resolve(sources.originalSrc);

      return streamFromCache(sources.cacheSrc, headers);
    }
    return new Response(toWebStreamFromReadable(nodeStream.pipe(pipeline)), {
      headers,
    });
  } catch (e: unknown) {
    pipelineLock.resolve(sources.cacheSrc);
    throw new Error(`Error while processing the image request`, {
      cause: e,
    });
  }
}
