# Custom Image Processing

OpenImg v1 introduces custom image processing capabilities through the React component's `params` prop and the optimizer endpoint's `getSharpPipeline` function. This enables custom image effects, filters, and processing logic. When utilizing custom processing, it's important to ensure that each unquie image returned by the optimizer endpoint has a unqiue URL and cache location. Otherwise, two separate image requests may conflict.

## Overview

The implementation consists of two components:

1. **Frontend (React)**: Use the `params` prop on the `<Img>` component to specify custom processing parameters
2. **Backend (Optimizer)**: Use the `getSharpPipeline` function to parse parameters and create custom Sharp pipelines

## Frontend: Using the params prop

The `<Img>` component accepts a `params` prop to pass additional parameters to the optimizer endpoint:

```tsx
import { Img } from "openimg/react";

function MyComponent() {
  return (
    <div>
      {/* Black and white filter */}
      <Img
        src="/portrait.jpg"
        width={800}
        height={600}
        alt="Portrait in black and white"
        params={{ blackWhite: "true" }}
      />

      {/* Background color and high quality */}
      <Img
        src="/product.png"
        width={400}
        height={400}
        alt="Product with white background"
        params={{ bgColor: "white", hq: "true" }}
      />

      {/* Multiple custom effects */}
      <Img
        src="/landscape.jpg"
        width={1200}
        height={800}
        alt="Vintage landscape"
        params={{
          sepia: "true",
          brightness: "110",
          contrast: "105",
        }}
      />
    </div>
  );
}
```

Parameters are automatically appended to image URLs as search parameters:

- `/img?src=/portrait.jpg&w=800&h=600&blackWhite=true`
- `/img?src=/product.png&w=400&h=400&bgColor=white&hq=true`
- `/img?src=/landscape.jpg&w=1200&h=800&sepia=true&brightness=110&contrast=105`

This ensures unique cachable image requests.

## Backend: Using getSharpPipeline

Implement the `getSharpPipeline` function on the optimizer endpoint to parse parameters and create custom Sharp processing pipelines:

### Implementation Example

```typescript
import { getImgResponse, getDefaultSharpPipeline } from "openimg/node";
import sharp from "sharp";

// In your image endpoint handler
app.get("/img", (c) => {
  return getImgResponse(c.req.raw, {
    getSharpPipeline: ({ params, source }) => {
      // Extract the request URL to access custom parameters
      const url = new URL(c.req.raw.url);

      // Check for custom parameters
      const blackWhite = url.searchParams.get("blackWhite") === "true";
      const bgColor = url.searchParams.get("bgColor");
      const highQuality = url.searchParams.get("hq") === "true";

      // If no custom processing needed, use default pipeline
      if (!blackWhite && !bgColor && !highQuality) {
        return undefined;
      }

      // Build custom pipeline
      let pipeline: sharp.Sharp;
      // Track applied effects to build unique cache key suffix
      let cacheKeySuffix = "";

      if (highQuality) {
        // Start with high-quality pipeline
        pipeline = sharp().autoOrient();

        if (params.width && params.height) {
          pipeline.resize(params.width, params.height, {
            fit: params.fit,
            kernel: sharp.kernel.lanczos3, // Higher quality resampling
          });
        }

        pipeline.sharpen(); // Add sharpening

        // High-quality format settings
        if (params.format === "webp") {
          pipeline.webp({ quality: 90 });
        } else if (params.format === "avif") {
          pipeline.avif({ quality: 85 });
        }

        // Add to cache key to differentiate from standard quality
        cacheKeySuffix += "-hq";
      } else {
        // Start with default pipeline for other effects
        pipeline = getDefaultSharpPipeline(params);
      }

      // Apply color effects
      if (blackWhite) {
        pipeline.greyscale();
        // Ensure black & white variant has unique cache entry
        cacheKeySuffix += "-bw";
      }

      if (bgColor) {
        // Flatten image against background color
        const color = bgColor === "white" ? "#ffffff" : bgColor;
        pipeline.flatten({ background: color });
        // Include background color in cache key for uniqueness
        cacheKeySuffix += `-bg-${bgColor}`;
      }

      return {
        pipeline,
        // Combine source identifier with processing parameters for unique cache key
        cacheKey: `${getCacheKeyFromSource(source)}${cacheKeySuffix}`,
      };
    },
  });
});

// Helper function to generate cache key from image source
function getCacheKeyFromSource(source: any): string {
  if (source.type === "fs") return source.path;
  if (source.type === "fetch") return source.url;
  return source.cacheKey;
}
```

## Important: Provide a unique `cacheKey`

When implementing custom Sharp pipelines with file caching enabled, providing a unique `cacheKey` is required. Without unique cache keys, different pipeline configurations may serve cached results from other pipelines. Each unique combination of image source and processing parameters must have its own cache entry to ensure correct image delivery.

Note width, height, and format are applied to the cache identifier internally. Only additional transformation must be included in the `cacheKey`.
