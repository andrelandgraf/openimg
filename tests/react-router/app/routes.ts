import { type RouteConfig, index } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  {
    file: "routes/img.tsx",
    path: "/img",
  },
] satisfies RouteConfig;
