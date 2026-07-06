import { defineConfig } from "vite";

// Serves the /demo page against the live TypeScript source.
export default defineConfig({
  root: "demo",
  server: { open: true },
});
