import React, { createContext, useContext } from "react";

export type Fit = "cover" | "contain";
export type Format = "webp" | "avif" | "png" | "jpeg" | "jpg";
export type TargetFormat = "webp" | "avif";

/**
 * getBreakpoints: return an array of width & height breakpoints for the picture element's srcsets
 * getSrc: return the src string for the picture element's img and sources
 * targetFormats: formats that should be included in the source options (default is avif, webp). It always includes the original format.
 * optimizerEndpoint: The path or URL to the image optimizer endpoint
 */
type OpenImgContextProps = {
  getBreakpoints: (width: number, height: number) => [number, number][];
  getSrc: (args: {
    src: string;
    width: number;
    height: number;
    fit?: Fit;
    format?: Format;
    optimizerEndpoint: string;
  }) => string;
  targetFormats: TargetFormat[];
  optimizerEndpoint: string;
};

const defaultContext: OpenImgContextProps = {
  getBreakpoints: (width, height) => {
    const breakpoints: [number, number][] = [];
    breakpoints.push([width, height]);

    let currentWidth = width - 200;
    let currentHeight = height - 200;

    while (currentWidth > 100 && currentHeight > 100) {
      breakpoints.push([currentWidth, currentHeight]);
      currentWidth = currentWidth - 200;
      currentHeight = currentHeight - 200;
    }

    breakpoints.push([100, 100]);
    return breakpoints;
  },
  getSrc: ({ src, width, height, fit, format, optimizerEndpoint }) => {
    const params = new URLSearchParams({
      src,
      w: width.toString(),
      h: height.toString(),
    });
    if (fit) params.append("fit", fit);
    if (format) params.append("format", format);
    return optimizerEndpoint + "?" + params.toString();
  },
  targetFormats: ["avif", "webp"],
  optimizerEndpoint: "/img",
};

export type OpenImgContextProviderProps = {
  getBreakpoints?: OpenImgContextProps["getBreakpoints"];
  getSrc?: OpenImgContextProps["getSrc"];
  targetFormats?: OpenImgContextProps["targetFormats"];
  optimizerEndpoint?: OpenImgContextProps["optimizerEndpoint"];
  children: React.ReactNode;
};

const OpenImgContext = createContext<OpenImgContextProps>(defaultContext);

export function OpenImgContextProvider({
  getBreakpoints,
  getSrc,
  targetFormats,
  optimizerEndpoint,
  children,
}: OpenImgContextProviderProps) {
  const contextValue = {
    getBreakpoints: getBreakpoints || defaultContext.getBreakpoints,
    getSrc: getSrc || defaultContext.getSrc,
    targetFormats: targetFormats || defaultContext.targetFormats,
    optimizerEndpoint: optimizerEndpoint || defaultContext.optimizerEndpoint,
  };

  return (
    <OpenImgContext.Provider value={contextValue}>
      {children}
    </OpenImgContext.Provider>
  );
}

export type ImageProps = Omit<
  React.ImgHTMLAttributes<HTMLImageElement>,
  "width" | "height"
> & {
  width: number | string;
  height: number | string;
  fit?: Fit;
  isAboveFold?: boolean;
};

/**
 * Image component
 * @param {string} src - The URL of the image to display
 * @param {number | string} width - The max width of the image in pixels
 * @param {number | string} height - The max height of the image in pixels
 * @param {Fit} fit - How the image should be resized to fit the dimensions: "cover" or "contain"
 * @param {boolean} isAboveFold - Whether the image is above the fold or not, affects what default optimization settings are used
 * @param {React.ImgHTMLAttributes<HTMLImageElement>} imgProps - Additional props to pass to the img element
 * @returns
 */
export function Image({
  src,
  width,
  height,
  fit,
  isAboveFold,
  ...imgProps
}: ImageProps) {
  if (!src || !width || !height) {
    console.error(
      "The `src`, `width`, and `height` props are required for the Image component.",
    );
    return null;
  }
  let widthNum = typeof width === "string" ? parseInt(width) : width;
  let heightNum = typeof height === "string" ? parseInt(height) : height;

  const { getBreakpoints, getSrc, targetFormats, optimizerEndpoint } =
    useContext(OpenImgContext);
  // Sorted from largest to smallest width
  const breakpoints = getBreakpoints(widthNum, heightNum).sort(
    ([w1], [w2]) => w2 - w1,
  );

  return (
    <picture>
      {targetFormats.map((format) => (
        <source
          key={format}
          srcSet={breakpoints
            .map(
              ([w, h]) =>
                getSrc({
                  src,
                  width: w,
                  height: h,
                  fit,
                  format,
                  optimizerEndpoint,
                }) + ` ${w}w`,
            )
            .join(", ")}
          sizes={
            breakpoints.map(([w]) => `(max-width: ${w}px) ${w}px`).join(", ") +
            `, ${widthNum}px`
          }
          type={`image/${format}`}
        />
      ))}
      <img
        src={getSrc({
          src,
          width: widthNum,
          height: heightNum,
          fit,
          optimizerEndpoint,
        })}
        srcSet={breakpoints
          .map(
            ([w, h]) =>
              getSrc({
                src,
                width: w,
                height: h,
                fit,
                optimizerEndpoint,
              }) + ` ${w}w`,
          )
          .join(", ")}
        sizes={
          breakpoints.map(([w]) => `(max-width: ${w}px) ${w}px`).join(", ") +
          `, ${widthNum}px`
        }
        width={width}
        height={height}
        role={imgProps.alt ? undefined : "presentation"}
        loading={isAboveFold ? "eager" : "lazy"}
        decoding={isAboveFold ? "auto" : "async"}
        fetchPriority={isAboveFold ? "high" : "low"}
        {...imgProps}
      />
    </picture>
  );
}

export { Image as Img };
export type { ImageProps as ImgProps };
