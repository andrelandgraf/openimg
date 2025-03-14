import { getImgResponse } from "openimg/bun";

Bun.serve({
  port: 3006,
  async fetch(req) {
    return getImgResponse(req, {
      getImgSource: () => {
        const cat = Bun.file("./public/cat.png");
        return {
          type: "data",
          data: cat.stream(),
          cacheKey: "cat",
        };
      },
    });
  },
});
