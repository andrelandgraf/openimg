# openimg-node

openimg-node (Open Image Node) provides an HTTP request handler function to optimize images using sharp.

## Installation

```bash
npm i sharp openimg-node
```

openimg-node uses [sharp](https://sharp.pixelplumbing.com) and can only be used in environments that can run sharp (and [libvips](https://github.com/libvips/libvips)).

## Considerations

Currently, there is only a "web" version of this package, using the HTTP `Request` and `Response` objects (web globals). This will be annyoing to work with if you are using Express or another Node library that operates on `IncomingMessage` and `ServerResponse` objects or similar.<D-s>
