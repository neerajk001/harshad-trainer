import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

import * as schema from "./schema";

// Build-safe: allow `next build` without a real DATABASE_URL.
// Runtime queries will fail with a clear error if unconfigured.
const connectionString =
  process.env.DATABASE_URL ?? "postgresql://localhost:5432/harsh_gorul_placeholder";

const sql = neon(connectionString);

export const db = drizzle(sql, { schema });
