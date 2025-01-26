import { getImgResponse } from 'openimg-node';

Bun.serve({
  async fetch(req) {
    const url = new URL(req.url);
    if (url.pathname.startsWith('/img')) {
      return getImgResponse(req);
    }
    const path = url.pathname;
    const file = Bun.file('public' + path);
    if (await file.exists()) {
      return new Response(file.stream());
    }
    return new Response('Not found', { status: 404 });
  },
});
