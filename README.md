# openimg

openimg (Open Image) is a collection of JavaScript packages for working with images on the web.

## Packages

- [openimg-bun](./packages/bun/): Image optimization request handler and other utilities optimized for Bun
- [openimg-node](./packages/node/): Node-compatible image optimization request handler and other utilities for Bun, Deno, and Node
- [openimg-react](./packages/react/): Image React component to query for optimized images
- [openimg](./packages/core/): All-in-one package bundling `openimg/bun`, `openimg/node`, `openimg/react`

## Use cases

- [Add an image optimization endpoint to your server](./docs/optimizer-endpoint.md)
- [Deploy a standalone image optimization server](./docs/optimizer-server.md)

## API reference

`openimg/bun` and `openimg/node` currently have the same API surface. You can read more about all supported arguments and props for each package in their respective README files:

- [openimg-bun](./packages/bun/README.md)
- [openimg-node](./packages/bun/README.md)
- [openimg-react](./packages/bun/README.md)
