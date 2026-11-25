import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  // Preserve the reference's legacy nested media queries verbatim. Lightning
  // CSS's minifier cannot flatten a few of Squarespace's generated queries.
  build: { cssMinify: false },
  server: {
    watch: {
      usePolling: process.env.CODEX_SANDBOX === "seatbelt",
    },
  },
});
