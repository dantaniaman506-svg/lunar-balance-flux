import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [
    TanStackRouterVite({
      routesDirectory: "./src/routes",
      generatedRouteTree: "./src/routeTree.gen.ts",
    }),
    react(),
    tailwindcss(),
    tsconfigPaths(),
  ],
  server: {
    port: 5000,
    host: "0.0.0.0",
    allowedHosts: true,
    watch: {
      ignored: ["**/node_modules/**", "**/.cache/**", "**/.output/**"],
    },
  },
  build: {
    outDir: "dist",
  },
});
