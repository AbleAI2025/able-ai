import { defineConfig } from 'drizzle-kit';
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

export default defineConfig({
  out: './drizzle',
  schema: './lib/drizzle/schema',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.NILEDB_URL || 'postgres://default-url-for-local-development',
  },
  verbose: true, // Optional: for more detailed output during generation
  strict: true,  // Optional: for stricter schema checking
});
