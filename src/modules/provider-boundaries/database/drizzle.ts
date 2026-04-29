import { drizzle } from "drizzle-orm/postgres-js";

import * as schema from "@/db/schema";
import { createDatabaseClient } from "@/modules/provider-boundaries/database/postgres";

export function createDrizzleClient(databaseUrl?: string) {
  return drizzle(createDatabaseClient(databaseUrl), { schema });
}
