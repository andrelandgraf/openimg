import type { Plugin } from "vite";
import { transformWithEsbuild } from "vite";
import { readFileSync } from "node:fs";
import { getImgPlaceholder } from "./placeholder";
import { getImgMetadata } from "./meta";

export function openimg(): Plugin {
  return {
    name: "vite-plugin-openimg",
    enforce: "pre",
    async load(importStr) {
      const [path, search] = importStr.split("?");
      if (!search) {
        return null;
      }
      if (search !== "react" && search !== "meta") {
        return null;
      }
      const formats = ["png", "jpg", "jpeg", "webp", "avif"];
      if (!formats.some((format) => path.endsWith(`.${format}`))) {
        // ignore files that are not images
        return null;
      }
      const buffer = readFileSync(path);
      const placeholder = await getImgPlaceholder(buffer);
      const { width, height } = await getImgMetadata(buffer);

      if (search === "meta") {
        return `import src from '${path}?url';

export const metadata = {
  placeholder: \`${placeholder}\`,
  src,
  width: ${width},
  height: ${height},
};
`;
      }

      const code = `import src from '${path}?url';

import { Img } from 'openimg/react';
      
const placeholder = \`${placeholder}\`;
      
export const metadata = {
  placeholder,
  src,
  width: ${width},
  height: ${height},
};
      
export default function Component(props) {
  return <Img
    src={src}
    placeholder={placeholder}
    width={${width}}
    height={${height}}
    {...props}
  />;
}
`;
      const transformed = await transformWithEsbuild(code, path, {
        loader: "tsx",
      });
      return transformed.code;
    },
  };
}
