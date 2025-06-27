# 🐳 Setting Up PostgreSQL with pgvector + Drizzle ORM (via Docker)
This guide walks you through how to:

- Run PostgreSQL with pgvector enabled using Docker

- Automatically create the vector extension

- Connect Drizzle ORM to your database

- Define and use vector(...) columns (e.g. for AI embeddings)

✅ Requirements
- Docker

- Node.js project with Drizzle set up

- (Optional) psql CLI or a PostgreSQL GUI like DBeaver/TablePlus

## 1️⃣ Folder Structure
```csharp
your-project/
├── docker-compose.yml
├── .env
├── init-db/
│   └── init.sql
└── ...
## 2️⃣ Docker Compose Config
docker-compose.yml
```

```yaml
version: "3.8"

services:
  db:
    image: pgvector/pgvector:pg15
    container_name: drizzle_postgres
    restart: unless-stopped
    ports:
      - "5438:5432" # Adjust the host port if 5432 is already in use
    environment:
      POSTGRES_USER: drizzle
      POSTGRES_PASSWORD: drizzle
      POSTGRES_DB: drizzle_db
    volumes:
      - pg_data:/var/lib/postgresql/data
      - ./init-db:/docker-entrypoint-initdb.d

volumes:
  pg_data:
```
This spins up PostgreSQL with the pgvector extension already available.

## 3️⃣ .env File
Make sure Drizzle knows where to connect:

```env
DATABASE_URL=postgres://drizzle:drizzle@localhost:5438/drizzle_db
```

## 4️⃣ Auto-create the vector Extension
Create a file at: init-db/init.sql

```sql
-- This runs only on first DB init
CREATE EXTENSION IF NOT EXISTS vector;
```
Docker will automatically run this on container creation (if volume is fresh).

To force rerun:

```bash
docker-compose down -v
docker-compose up -d
```
## 5️⃣ Start PostgreSQL
```bash
docker-compose up -d
```
## 6️⃣ Verify the Extension (Optional)
Enter the container:

```bash
docker exec -it drizzle_postgres psql -U drizzle -d drizzle_db
```
Check installed extensions:

```sql
\dx
```
You should see:

```pgsql
Name   | Version | Schema | Description
-------+---------+--------+-------------
vector | 0.5.x   | public | vector data type
```
## 7️⃣ Define vector Columns in Drizzle
```ts
import { pgTable, uuid, vector } from "drizzle-orm/pg-core";

export const VectorEmbeddingsTable = pgTable("vector_embeddings", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  embedding: vector("embedding", { dimensions: 1536 }).notNull(),
});
```
## 8️⃣ Push to DB with Drizzle
```bash
npx drizzle-kit push
```
# or (if you use migrations)
```bash
npx drizzle-kit generate
npx drizzle-kit migrate
```
✅ Done!
You now have a working PostgreSQL instance with pgvector ready for storing and querying high-dimensional embeddings using Drizzle ORM.