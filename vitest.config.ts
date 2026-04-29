import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: false,
    include: ["tests/{unit,integration,rls}/**/*.test.ts"],
  },
  resolve: {
    alias: {
      "@": new URL("./src", import.meta.url).pathname,
    },
  },
});
