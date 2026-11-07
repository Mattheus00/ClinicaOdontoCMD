import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    ...(mode === "ux-demo"
      ? [
          {
            name: "isolated-local-ux",
            transformIndexHtml: {
              order: "pre" as const,
              handler(html: string) {
                return html.replace("/src/main.tsx", "/src/demo/main.tsx");
              },
            },
          },
        ]
      : []),
  ],
  build: { outDir: mode === "ux-demo" ? "dist-ux-demo" : "dist" },
  server: {
    host: "127.0.0.1",
    ...(mode === "ux-demo"
      ? {}
      : { proxy: { "/api": "http://localhost:8080" } }),
  },
  preview: { host: "127.0.0.1" },
}));
