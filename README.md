# openimg

openimg (Open Image) is a set of JavaScript packages for working with images on the web. It includes a React component, server-side code for Node and Bun, and a Vite plugin. Every part is built to work smoothly together, but you can also use them individually.

## Getting started

The easiest way to get started is to integrate openimg as an image optimization endpoint on your existing server. From there, you can utilize the React component to query for optimized images and use the Vite plugin to integrate local image assets from your Vite project. You can follow the [optimization endpoint guide](./docs/guides/optimizer-endpoint.md) for a step-by-step walkthrough.

## Use cases

- [Add an image optimization endpoint to your server](./docs/guides/optimizer-endpoint.md)
- [Deploy a standalone image optimization server](./docs/guides/optimizer-server.md)

## API reference

- [openimg/bun](./docs/api/bun.md): Image optimization request handler and other utilities optimized for Bun
- [openimg/node](./docs/api/node.md): Node-compatible image optimization request handler and other utilities for Bun, Deno, and Node
- [openimg/react](./docs/api/react.md): Image React component to query for optimized images
- [openimg/vite](./docs/api/vite.md): Vite plugin for integrating local image assets from your Vite project

## Changelog

Find the changelog here: [CHANGELOG.md](./packages/core/CHANGELOG.md)

## Motivation & references

Why another image optimization package? I wanted a full-stack solution that works out of the box with minimal setup. This could have been a small wrapper around `unjs/ipx` and `unpic/image`, but I first wanted to build something from scratch and minimize dependencies (other than sharp).

The HTTP request handler is inspired by [this Gist by Jacob Ebey](https://gist.github.com/jacob-ebey/3a37a86307de9ef22f47aae2e593b56f) that showcases how to use sharp with stream processing.
