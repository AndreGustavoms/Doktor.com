import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "sqlite",
  schema: "./src/server/db/schema.ts",
  out: "./src/server/db/migrations",
  dbCredentials: {
    // data/ é gitignored — o banco nunca é versionado (ver docs/SECURITY.md A2).
    url: "./data/app.db",
  },
});
