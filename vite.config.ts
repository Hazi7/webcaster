/// <reference types="vitest/config" />

import react from "@vitejs/plugin-react";
import autoprefixer from "autoprefixer";
import { resolve } from "node:path";
import tailwindcss from "tailwindcss";
import { defineConfig } from "vite";
export default defineConfig({
  css: {
    postcss: {
      plugins: [tailwindcss(), autoprefixer()],
    },
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
  plugins: [react()],
});
