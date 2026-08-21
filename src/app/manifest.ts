import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Senam Mata",
    short_name: "Senam Mata",
    description:
      "Aplikasi web untuk meredakan kelelahan mata akibat layar: tes mata mandiri, latihan mata terpandu, dan pengingat 20-20-20.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#3a9b8f",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
