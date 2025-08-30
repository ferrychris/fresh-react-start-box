import { defineConfig } from "vite";
import react from "@vitejs/plugin-react"; // swap from swc to non-swc (already installed)
import path from "path";

let componentTagger: (() => any) | null = null;
try {
  // Load only if installed and only used in dev
  ({ componentTagger } = await import("lovable-tagger"));
} catch {
  componentTagger = null;
}

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === "development" && componentTagger ? componentTagger() : null,
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));