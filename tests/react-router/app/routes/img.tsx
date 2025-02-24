import { getImgResponse } from "openimg/node";
import type { LoaderFunctionArgs } from "react-router";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const src = url.searchParams.get("src");
  return getImgResponse(request, {
    getImgSource: () => {
      return {
        type: "fs",
        path: "." + src,
      };
    },
  });
}
