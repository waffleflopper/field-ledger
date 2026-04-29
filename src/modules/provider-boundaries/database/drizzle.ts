import { drizzle } from "drizzle-orm/postgres-js";

import * as schema from "@/db/schema";
import { createDatabaseClient } from "@/modules/provider-boundaries/database/postgres";

let sharedDrizzleClient: ReturnType<typeof createDrizzleClient> | null = null;

export function createDrizzleClient(databaseUrl?: string) {
  return drizzle(createDatabaseClient(databaseUrl), { schema });
}

export function getDrizzleClient() {
  sharedDrizzleClient ??= createDrizzleClient();

  return sharedDrizzleClient;
}
