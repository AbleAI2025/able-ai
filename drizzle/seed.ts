// File: drizzle/seed.ts
import 'dotenv/config'; // Load environment variables
import { eq } from "drizzle-orm";
import { db } from "@/lib/drizzle/db";
import { UsersTable, GigWorkerProfilesTable } from "@/lib/drizzle/schema";

async function seed() {
  console.log("🔍 Looking for users without a gig worker profile...");

  // Check that the database URL is defined
  if (!process.env.NILEDB_URL) {
    console.error("❌ Error: NILEDB_URL is not defined in .env");
    process.exit(1);
  }

  try {
    // 1️⃣ Get all users
    const users = await db.select().from(UsersTable);

    let createdCount = 0;

    for (const user of users) {
      // 2️⃣ Check if the user already has a gig worker profile
      const existingProfile = await db
        .select()
        .from(GigWorkerProfilesTable)
        .where(eq(GigWorkerProfilesTable.userId, user.id))
        .limit(1);

      if (existingProfile.length === 0) {
        // 3️⃣ Create a new gig worker profile
        await db.insert(GigWorkerProfilesTable).values({
          userId: user.id,
          fullBio: "",
          location: null,
          address: null,
          latitude: null,
          longitude: null,
          hashtags: null,
          privateNotes: null,
          responseRateInternal: null,
          availabilityJson: null,
          semanticProfileJson: null,
          videoUrl: null,
        });

        createdCount++;
        console.log(`✅ Created gig worker profile for user: ${user.fullName} (${user.id})`);
      }
    }

    console.log(`🎉 Seed completed. Profiles created: ${createdCount}`);
  } catch (err) {
    console.error("❌ Error during seed execution:", err);
    process.exit(1);
  }
}

// Run the seed function
seed()
  .then(() => {
    console.log("🌱 Seed finished successfully");
    process.exit(0);
  })
  .catch((err) => {
    console.error("❌ Unexpected error in seed:", err);
    process.exit(1);
  });