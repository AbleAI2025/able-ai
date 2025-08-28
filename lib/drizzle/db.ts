import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema";
import * as relations from "./schema/relations";

// You can specify any property from the node-postgres connection options
export const db = drizzle({
  connection: {
    connectionString: process.env.NILEDB_URL!,
    ssl: process.env.NODE_ENV === "production",
  },
  schema: { ...schema, ...relations },
});
