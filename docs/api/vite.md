# openimg-vite

openimg-vite (Open Image Vite) provides an Vite plugin to transform local image asset imports with `?react` and `?meta` queries into a React component and metadata object, respectively.

## Installation

Install the openimg package and its dependencies:

```bash
npm i openimg sharp
```

## Integrating the Vite plugin

Add the openimg Vite plugin to your vite.config.ts file:

```typescript
import { defineConfig } from "vite";
import { openimg } from "openimg/vite";

export default defineConfig(() => ({
  plugins: [openimg()],
}));
```

## Adding the types

If you are using TypeScript, add the `openimg/client` types to your tsconfig.json file. Make sure they are listed after the `vite/client` types to ensure proper merging:

```json
{
  "compilerOptions": {
    "types": ["vite/client", "openimg/client"]
  }
}
```

This ensures that all `*(png|jpg|jpeg|avif|webp)?react` and `*(png|jpg|jpeg|avif|webp)?meta` imports are correctly typed.

## Usage ?react

Add an image file to your source directly (e.g., `src/assets/cat.png`) and import it with the `?react` query:

```tsx
import CatImg from "./assets/cat.png?react";

export default function App() {
  return <CatImg alt="A cute cat" />;
}
```

The `?react` query will transform the image import into a React component that renders the `Img` component from openimg/react under the hood. You can read more about the `Img` component in the [openimg/react documentation](./react.md).

## Usage ?meta

You can also import the metadata of an image with the `?meta` query:

```tsx
import { metadata } from "./assets/cat.png?meta";

console.log(metadata); // { width: 800, height: 600, format: "png", src: "/assets/cat.png" }

export default function App() {
  return (
    <img
      src={metadata.src}
      width={metadata.width}
      height={metadata.height}
      alt="A cute cat"
    />
  );
}
```

Note the metadata object is also available via `?react`.
