// File: app/lib/drizzle/schema/vector.ts

import {
    pgTable,
    uuid,
    text,
    timestamp,
    varchar,
    vector, // Import the vector type from Drizzle!
    index,    // Import index for defining custom indexes
  } from "drizzle-orm/pg-core";
  import { sql } from "drizzle-orm";
  
  // Import enums
  import { vectorEntityTypeEnum } from "./enums";
  
  // --- VECTOR EMBEDDINGS TABLE ---
  export const VectorEmbeddingsTable = pgTable("vector_embeddings", {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    entityType: vectorEntityTypeEnum("entity_type").notNull(),
    entityPostgresId: uuid("entity_postgres_id"), // FK to PG table ID
    entityFirestoreId: text("entity_firestore_id"),   // FK to Firestore document ID
  
    // Use Drizzle's built-in vector type
    embedding: vector("embedding", { dimensions: 1536 }).notNull(), // Specify dimensions for your model (e.g., OpenAI ada-002)
  
    sourceTextHash: varchar("source_text_hash", { length: 64 }), // SHA256 hash
    embeddingModelUsed: varchar("embedding_model_used", { length: 100 })
      .default("text-embedding-ada-002"),
  
    createdAt: timestamp("created_at", { mode: "date", withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp("updated_at", { mode: "date", withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(), // Application logic should update this field
  }, (table) => ([ // Array syntax for table-level constraints
    // Define the HNSW index directly in the schema using Drizzle's syntax
    // The .op('vector_cosine_ops') is specific to pgvector for cosine distance.
    // Other options include vector_l2_ops (Euclidean) or vector_ip_ops (inner product).
    index("embedding_hnsw_cosine_idx") // Name your index
      .using("hnsw", table.embedding.op("vector_cosine_ops")), // Specify HNSW method and operator class
  
    // Optional: Add unique constraints if needed, e.g., an entity should only have one embedding of a certain type
    // uniqueIndex("entity_embedding_unique_idx").on(table.entityType, table.entityPostgresId), // if entityPostgresId is the primary link
    // uniqueIndex("entity_firestore_embedding_unique_idx").on(table.entityType, table.entityFirestoreId) // if entityFirestoreId is the primary link
  ]));

// --- TODO: Define relations if needed (e.g., if you want to easily join back to the source entity from an embedding) ---
// However, embeddings are often queried by entityPostgresId or entityFirestoreId directly when performing searches.
