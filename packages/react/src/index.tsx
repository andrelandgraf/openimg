import React, { createContext, useContext } from "react";

export type Fit = "cover" | "contain";
export type Format = "webp" | "avif" | "png" | "jpeg" | "jpg";

type OpenImgContextProps = {
  getBreakpoints: (width: number, height: number) => [number, number][];
  getSrc: (src: string, options: { width: number; height: number; fit?: Fit; format?: Format }) => string;
  targetFormats: Format[];
};

const defaultContext: OpenImgContextProps = {
  getBreakpoints: (width, height) => {
    const breakpoints: [number, number][] = [];
    let currentWidth = width;
    let currentHeight = height;

    while (currentWidth > 200 && currentHeight > 200) {
      breakpoints.push([currentWidth, currentHeight]);
      currentWidth = Math.floor(currentWidth * 0.75);
      currentHeight = Math.floor(currentHeight * 0.75);
    }

    breakpoints.push([200, 200]);
    return breakpoints;
  },
  getSrc: (src, { width, height, fit, format }) => {
    const params = new URLSearchParams({ w: width.toString(), h: height.toString() });
    if (fit) params.append("fit", fit);
    if (format) params.append("format", format);
    return `/img${src}?${params.toString()}`;
  },
  targetFormats: ["avif", "webp"],
};

export type OpenImgContextProviderProps = {
  getBreakpoints?: OpenImgContextProps["getBreakpoints"];
  getSrc?: OpenImgContextProps["getSrc"];
  targetFormats?: OpenImgContextProps["targetFormats"];
  children: React.ReactNode;
};

const OpenImgContext = createContext<OpenImgContextProps>(defaultContext);

export function OpenImgContextProvider({
  getBreakpoints,
  getSrc,
  targetFormats,
  children,
}: OpenImgContextProviderProps) {
  const contextValue = {
    getBreakpoints: getBreakpoints || defaultContext.getBreakpoints,
    getSrc: getSrc || defaultContext.getSrc,
    targetFormats: targetFormats || defaultContext.targetFormats,
  };

  return <OpenImgContext.Provider value={contextValue}> {children} </OpenImgContext.Provider>;
}

export type ImageProps = Omit<React.ImgHTMLAttributes<HTMLImageElement>, "width" | "height"> & {
  width: number;
  height: number;
  fit?: Fit;
};

export function Image({ src, width, height, fit, ...imgProps }: ImageProps) {
  if (!src || !width || !height) {
    console.error("The `src`, `width`, and `height` props are required for the Image component.");
    return null;
  }

  const { getBreakpoints, getSrc, targetFormats } = useContext(OpenImgContext);
  const breakpoints = getBreakpoints(width, height);

  return (
    <picture>
      {
        targetFormats.map((format) =>
          breakpoints.map(([w, h]) => (
            <source
              key={`${format}-${w}-${h}`}
              srcSet={getSrc(src, { width: w, height: h, fit, format })}
              media={`(min-width: ${w}px)`
              }
              type={`image/${format}`}
            />
          ))
        )}
      <img
        src={getSrc(src, { width, height, fit })}
        width={width}
        height={height}
        {...imgProps}
      />
    </picture>
  );
}

export { Image as Img };
export type { ImageProps as ImgProps };
