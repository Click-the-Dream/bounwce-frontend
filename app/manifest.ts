import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  const ORIGIN = process.env.NEXT_PUBLIC_APP_URL;

  return {
    id: "/",
    name: "Bouwnce",
    short_name: "Bouwnce",
    description: "Bouwnce — Find your people. Get what you need.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#000000",
    theme_color: "#000000",
    related_applications: [
      {
        platform: "webapp",
        id: "/",
        url: `${ORIGIN}/manifest.webmanifest`,
      },
    ],
    prefer_related_applications: false,
    protocol_handlers: [
      {
        protocol: "web+bouwnce",
        url: "/?action=%s",
      },
    ],

    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/icons/icon-512-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
