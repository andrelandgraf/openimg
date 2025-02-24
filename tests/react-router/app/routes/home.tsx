import type { Route } from "./+types/home";
import CatImg from "../assets/cat.png?react";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "New React Router App" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

export default function Home() {
  return (
    <main className="flex flex-col items-center justify-center pt-16 pb-4">
      <CatImg className="max-w-[500px] h-auto" />
    </main>
  );
}
