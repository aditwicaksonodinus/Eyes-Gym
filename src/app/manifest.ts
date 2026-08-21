// Next.js Metadata API manifest — auto-served at /manifest.webmanifest.
// This is the canonical manifest; do NOT add a second route handler for it
// (e.g. manifest.webmanifest.ts), or Next will warn about a duplicate page.
import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SeeFit",
    short_name: "SeeFit",
    description:
      "Latihan mata singkat untuk meredakan kelelahan layar. Tes mandiri, panduan terpandu, dan pengingat 20-20-20 — langsung di peramban.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#307c91",
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
