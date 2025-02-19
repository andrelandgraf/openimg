# openimg

openimg (Open Image) is a set of JavaScript packages for working with images on the web. It includes a React component, server-side code for Node and Bun, and a Vite plugin. Every part is built to work smoothly together, but you can also use them individually.

## Getting started

The easiest way to get started is to integrate openimg as a image optimization endpoint on your existing server. From there, you can utilize the React component to query for optimized images and use the Vite plugin to integrate local image assets from your Vite project. You can follow the [use case guide](./docs/use-cases/optimizer-endpoint.md) for a step-by-step walkthrough.

## Use cases

- [Add an image optimization endpoint to your server](./docs/use-cases/optimizer-endpoint.md)
- [Deploy a standalone image optimization server](./docs/use-cases/optimizer-server.md)

## API reference

- [openimg/bun](./docs/api/bun.md): Image optimization request handler and other utilities optimized for Bun
- [openimg/node](./docs/api/node.md): Node-compatible image optimization request handler and other utilities for Bun, Deno, and Node
- [openimg/react](./docs/api/react.md): Image React component to query for optimized images
- [openimg/vite](./docs/api/vite.md): Vite plugin for integrating local image assets from your Vite project
