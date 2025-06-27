"use server"
import { db } from "@/lib/drizzle/db"; // Correct path to your Drizzle instance
import { UsersTable } from "@/lib/drizzle/schema";
import { eq } from "drizzle-orm";

export const  getProfileInfoUserAction = async (firebaseUid: string) => {
    try {
        const pgUser = await db.query.UsersTable.findFirst({
          where: eq(UsersTable.firebaseUid, firebaseUid),
        });
    
        return pgUser
    } catch (error) {
        console.log("Error getting user profile");
        
    }
}