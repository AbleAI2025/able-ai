import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema";
import * as relations from "./schema/relations";

// Debug: Log what's being imported
console.log("🔍 Drizzle DB - Schema keys:", Object.keys(schema));
console.log("🔍 Drizzle DB - Relations keys:", Object.keys(relations));
console.log("🔍 Drizzle DB - NILEDB_URL exists:", !!process.env.NILEDB_URL);

// You can specify any property from the node-postgres connection options
export const db = drizzle({
  connection: {
    connectionString: process.env.NILEDB_URL!,
    ssl: process.env.NODE_ENV === "production",
  },
  schema: { ...schema, ...relations },
});
