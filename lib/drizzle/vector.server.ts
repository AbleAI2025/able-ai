// File: app/lib/db/vector.server.ts
import { db as drizzleDB } from '@/lib/drizzle/db'; // Corrected path
import { VectorEmbeddingsTable } from '@/lib/drizzle/schema/vector';
import { vectorEntityTypeEnum } from '@/lib/drizzle/schema/enums'; // Assuming this is where your enum is
import { sql, desc, gt, cosineDistance, eq, and } from 'drizzle-orm';

interface EmbeddingSearchResult {
    id: string;
    entityType: string; // Consider using (typeof vectorEntityTypeEnum.enumValues)[number]
    entityPostgresId?: string | null;
    entityFirestoreId?: string | null;
    similarity: number;
}

export async function findSimilarEmbeddings({
    queryEmbedding,
    entityType,
    limit = 10,
    minSimilarity = 0.7,
}: {
    queryEmbedding: number[];
    entityType: (typeof vectorEntityTypeEnum.enumValues)[number]; // Use enum values for type safety
    limit?: number;
    minSimilarity?: number;
}): Promise<EmbeddingSearchResult[]> {
    try {
        const similarityScore = sql<number>`1 - (${cosineDistance(
            VectorEmbeddingsTable.embedding,
            queryEmbedding // Drizzle parameterizes this
        )})`;

        const results = await drizzleDB
            .select({
                id: VectorEmbeddingsTable.id,
                entityType: VectorEmbeddingsTable.entityType,
                entityPostgresId: VectorEmbeddingsTable.entityPostgresId,
                entityFirestoreId: VectorEmbeddingsTable.entityFirestoreId,
                similarity: similarityScore,
            })
            .from(VectorEmbeddingsTable)
            .where(
                and( // Use Drizzle's 'and' operator for multiple conditions
                    eq(VectorEmbeddingsTable.entityType, entityType),
                    gt(similarityScore, minSimilarity)
                )
            )
            .orderBy(desc(similarityScore))
            .limit(limit);

        // Drizzle should return typed results if select fields match the interface.
        // If not, you might need a more explicit mapping or ensure types align.
        return results.map(row => ({
            id: row.id,
            entityType: row.entityType as (typeof vectorEntityTypeEnum.enumValues)[number],
            entityPostgresId: row.entityPostgresId,
            entityFirestoreId: row.entityFirestoreId,
            similarity: Number(row.similarity), // Ensure similarity is a number
        }));
    } catch (error) {
        console.error("Error finding similar embeddings with Drizzle:", error);
        throw error;
    }
}

export async function upsertEmbedding({
    entityType,
    entityPostgresId,
    entityFirestoreId,
    embedding,
    sourceTextHash,
    embeddingModelUsed,
}: {
    entityType: (typeof vectorEntityTypeEnum.enumValues)[number];
    entityPostgresId?: string | null; // Make explicitly nullable
    entityFirestoreId?: string | null; // Make explicitly nullable
    embedding: number[];
    sourceTextHash: string;
    embeddingModelUsed?: string;
}): Promise<void> { // Or return the upserted record: Promise<typeof VectorEmbeddingsTable.$inferSelect | null>
    if (!entityPostgresId && !entityFirestoreId) {
        throw new Error("Either entityPostgresId or entityFirestoreId must be provided for upsert.");
    }

    const valuesToUpsert = {
        entityType,
        entityPostgresId: entityPostgresId || null, // Ensure null if undefined
        entityFirestoreId: entityFirestoreId || null, // Ensure null if undefined
        embedding,
        sourceTextHash,
        embeddingModelUsed: embeddingModelUsed || 'text-embedding-ada-002',
        updatedAt: new Date(), // Explicitly set updatedAt
        // createdAt will be set by default on insert
    };

    try {
        if (entityPostgresId) {
            // Assumes a unique constraint/index named 'uq_vector_entity_pg_id_idx'
            // exists on (entity_type, entity_postgres_id)
            await drizzleDB.insert(VectorEmbeddingsTable)
                .values({ ...valuesToUpsert, createdAt: new Date() }) // also set createdAt for insert part
                .onConflictDoUpdate({
                    // Specify the columns that form the unique constraint for this path
                    target: [VectorEmbeddingsTable.entityType, VectorEmbeddingsTable.entityPostgresId],
                    set: {
                        embedding: valuesToUpsert.embedding,
                        sourceTextHash: valuesToUpsert.sourceTextHash,
                        embeddingModelUsed: valuesToUpsert.embeddingModelUsed,
                        updatedAt: valuesToUpsert.updatedAt,
                    }
                });
        } else if (entityFirestoreId) {
            // Assumes a unique constraint/index named 'uq_vector_entity_fs_id_idx'
            // exists on (entity_type, entity_firestore_id)
            await drizzleDB.insert(VectorEmbeddingsTable)
                .values({ ...valuesToUpsert, createdAt: new Date() })
                .onConflictDoUpdate({
                    // Specify the columns that form the unique constraint for this path
                    target: [VectorEmbeddingsTable.entityType, VectorEmbeddingsTable.entityFirestoreId],
                    set: {
                        embedding: valuesToUpsert.embedding,
                        sourceTextHash: valuesToUpsert.sourceTextHash,
                        embeddingModelUsed: valuesToUpsert.embeddingModelUsed,
                        updatedAt: valuesToUpsert.updatedAt,
                    }
                });
        }
    } catch (error) {
        console.error("Error upserting embedding:", error);
        throw error;
    }
}