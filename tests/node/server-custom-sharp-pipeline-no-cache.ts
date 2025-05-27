import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { getImgResponse } from "openimg/node";
import sharp from "sharp";

const app = new Hono();

app.get("*", async (c) => {
  return getImgResponse(c.req.raw, {
    cacheFolder: "no_cache", // Disable caching
    getSharpPipeline: ({ params, source }) => {
      // Get URL to extract custom parameters
      const url = new URL(c.req.raw.url);

      // Extract custom parameters
      const blackAndWhite = url.searchParams.get("bw") === "true";
      const highQuality = url.searchParams.get("hq") === "true";
      const sepia = url.searchParams.get("sepia") === "true";

      // If no custom parameters, use default pipeline
      if (!blackAndWhite && !highQuality && !sepia) {
        return undefined;
      }

      // Helper function to get cache key from source
      function getCacheKeyFromSource(source: any): string {
        if (source.type === "fs") return source.path;
        if (source.type === "fetch") return source.url;
        return source.cacheKey || "data";
      }

      let pipeline: sharp.Sharp;
      let cacheKeySuffix = "";

      if (highQuality) {
        // High quality pipeline with custom settings
        pipeline = sharp().rotate();

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

        cacheKeySuffix += "-hq";
      } else {
        // Start with basic pipeline for other filters
        pipeline = sharp().rotate();

        if (params.width && params.height) {
          pipeline.resize(params.width, params.height, { fit: params.fit });
        }

        if (params.format === "avif") {
          pipeline.avif();
        } else if (params.format === "webp") {
          pipeline.webp();
        }
      }

      // Apply additional filters
      if (blackAndWhite) {
        pipeline.greyscale();
        cacheKeySuffix += "-bw";
      }

      if (sepia) {
        pipeline.tint({ r: 255, g: 240, b: 16 });
        cacheKeySuffix += "-sepia";
      }

      return {
        pipeline,
        cacheKey: `${getCacheKeyFromSource(source)}${cacheKeySuffix}`,
      };
    },
  });
});

const port = 3008;
console.log(`Custom Sharp Pipeline (No Cache) server running on port ${port}`);

serve({
  fetch: app.fetch,
  port,
});
