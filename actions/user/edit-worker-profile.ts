"use server";
import { db } from "@/lib/drizzle/db";
import {
  EquipmentTable,
  GigWorkerProfilesTable,
  QualificationsTable,
  SkillsTable,
  UsersTable,
} from "@/lib/drizzle/schema";
import { ERROR_CODES } from "@/lib/responses/errors";
import { isUserAuthenticated } from "@/lib/user.server";
import { and, eq } from "drizzle-orm";

export const addQualificationAction = async (
  title: string,
  token?: string,
  skillId?: string,
  description?: string,
  institution?: string,
  documentUrl?: string
) => {
  try {
    if (!token) {
      throw new Error("User ID is required to fetch buyer profile");
    }

    if (!skillId) {
      throw new Error("Skill id is required");
    }

    const { uid } = await isUserAuthenticated(token);
    if (!uid) throw ERROR_CODES.UNAUTHORIZED;

    const user = await db.query.UsersTable.findFirst({
      where: eq(UsersTable.firebaseUid, uid),
    });

    if (!user) {
      throw new Error("User not found");
    }

    const workerProfile = await db.query.GigWorkerProfilesTable.findFirst({
      where: eq(GigWorkerProfilesTable.userId, user.id),
    });

    if (!workerProfile) {
      throw new Error("Worker profile not found");
    }

    const result = await db
      .insert(QualificationsTable)
      .values({
        workerProfileId: workerProfile.id,
        title: title,
        description: description,
        institution: institution,
        documentUrl: documentUrl,
        skillId: skillId,
        yearAchieved: new Date().getFullYear(),
      })
      .returning();

    if (result.length === 0) {
      throw new Error("Failed to add qualification");
    }

    return { success: true, data: "Qualification created successfully" };
  } catch (error) {
    console.log("Error adding qualification", error);
    return {
      success: false,
      error: "An unexpected error occurred while adding the qualification.",
    };
  }
};

export const deleteQualificationAction = async (
  qualificationId: string,
  token?: string
) => {
  try {
    if (!token) {
      throw new Error("User ID is required to fetch buyer profile");
    }

    const { uid } = await isUserAuthenticated(token);
    if (!uid) throw ERROR_CODES.UNAUTHORIZED;

    const user = await db.query.UsersTable.findFirst({
      where: eq(UsersTable.firebaseUid, uid),
    });

    if (!user) {
      throw new Error("User not found");
    }

    const workerProfile = await db.query.GigWorkerProfilesTable.findFirst({
      where: eq(GigWorkerProfilesTable.userId, user.id),
    });

    if (!workerProfile) {
      throw new Error("Worker profile not found");
    }

    const qualification = await db.query.QualificationsTable.findFirst({
      where: eq(QualificationsTable.id, qualificationId),
    });

    if (!qualification) {
      throw new Error("Qualification not found");
    }

    if (qualification.workerProfileId !== workerProfile.id) {
      throw new Error("Unauthorized to delete this qualification");
    }

    const result = await db
      .delete(QualificationsTable)
      .where(eq(QualificationsTable.id, qualificationId))
      .returning();

    if (result.length === 0) {
      throw new Error("Failed to delete qualification");
    }

    return { success: true, data: "Qualification deleted successfully" };
  } catch (error) {
    console.log("Error subscribing to topic", error);
    return { success: false, error: error };
  }
};

export const editQualificationAction = async (
  qualificationId: string,
  title: string,
  token?: string,
  description?: string,
  institution?: string,
  documentUrl?: string
) => {
  try {
    if (!token) {
      throw new Error("User ID is required to fetch buyer profile");
    }

    const { uid } = await isUserAuthenticated(token);
    if (!uid) throw ERROR_CODES.UNAUTHORIZED;

    const user = await db.query.UsersTable.findFirst({
      where: eq(UsersTable.firebaseUid, uid),
    });

    if (!user) {
      throw new Error("User not found");
    }

    const workerProfile = await db.query.GigWorkerProfilesTable.findFirst({
      where: eq(GigWorkerProfilesTable.userId, user.id),
    });

    if (!workerProfile) {
      throw new Error("Worker profile not found");
    }

    const qualification = await db.query.QualificationsTable.findFirst({
      where: eq(QualificationsTable.id, qualificationId),
    });

    if (!qualification) {
      throw new Error("Qualification not found");
    }

    if (qualification.workerProfileId !== workerProfile.id) {
      throw new Error("Unauthorized to edit this qualification");
    }

    const result = await db
      .update(QualificationsTable)
      .set({
        title: title,
        description: description,
        institution: institution,
        documentUrl: documentUrl,
      })
      .where(eq(QualificationsTable.id, qualificationId))
      .returning();

    if (result.length === 0) {
      throw new Error("Failed to edit qualification");
    }

    return { success: true, data: "Qualification edited successfully" };
  } catch (error) {
    console.log("Error subscribing to topic", error);
    return { success: false, error: error };
  }
};

export const addEquipmentAction = async (
  name: string,
  token?: string,
  description?: string,
  documentUrl?: string
) => {
  try {
    if (!token) {
      throw new Error("User ID is required to fetch buyer profile");
    }

    const { uid } = await isUserAuthenticated(token);
    if (!uid) throw ERROR_CODES.UNAUTHORIZED;

    const user = await db.query.UsersTable.findFirst({
      where: eq(UsersTable.firebaseUid, uid),
    });

    if (!user) {
      throw new Error("User not found");
    }

    const workerProfile = await db.query.GigWorkerProfilesTable.findFirst({
      where: eq(GigWorkerProfilesTable.userId, user.id),
    });

    if (!workerProfile) {
      throw new Error("Worker profile not found");
    }

    const result = await db
      .insert(EquipmentTable)
      .values({
        name: name,
        description: description,
        workerProfileId: workerProfile.id,
      })
      .returning();

    if (result.length === 0) {
      throw new Error("Failed to add equipment");
    }

    return { success: true, data: "Equipment created successfully" };
  } catch (error) {
    console.log("Error subscribing to topic", error);
    return { success: false, error: error };
  }
};

export const deleteEquipmentAction = async (
  equipmentId: string,
  token?: string
) => {
  try {
    if (!token) {
      throw new Error("User ID is required to fetch buyer profile");
    }

    const { uid } = await isUserAuthenticated(token);
    if (!uid) throw ERROR_CODES.UNAUTHORIZED;

    const user = await db.query.UsersTable.findFirst({
      where: eq(UsersTable.firebaseUid, uid),
    });

    if (!user) {
      throw new Error("User not found");
    }

    const workerProfile = await db.query.GigWorkerProfilesTable.findFirst({
      where: eq(GigWorkerProfilesTable.userId, user.id),
    });

    if (!workerProfile) {
      throw new Error("Worker profile not found");
    }

    const equipment = await db.query.EquipmentTable.findFirst({
      where: eq(EquipmentTable.id, equipmentId),
    });

    if (!equipment) {
      throw new Error("Equipment not found");
    }

    if (equipment.workerProfileId !== workerProfile.id) {
      throw new Error("Unauthorized to delete this equipment");
    }

    const result = await db
      .delete(EquipmentTable)
      .where(eq(EquipmentTable.id, equipmentId))
      .returning();

    if (result.length === 0) {
      throw new Error("Failed to delete equipment");
    }

    return { success: true, data: "Equipment deleted successfully" };
  } catch (error) {
    console.log("Error subscribing to topic", error);
    return { success: false, error: error };
  }
};

export const editEquipmentAction = async (
  equipmentId: string,
  name: string,
  token?: string,
  description?: string
) => {
  try {
    if (!token) {
      throw new Error("User ID is required to fetch buyer profile");
    }

    const { uid } = await isUserAuthenticated(token);
    if (!uid) throw ERROR_CODES.UNAUTHORIZED;

    const user = await db.query.UsersTable.findFirst({
      where: eq(UsersTable.firebaseUid, uid),
    });

    if (!user) {
      throw new Error("User not found");
    }

    const workerProfile = await db.query.GigWorkerProfilesTable.findFirst({
      where: eq(GigWorkerProfilesTable.userId, user.id),
    });

    if (!workerProfile) {
      throw new Error("Worker profile not found");
    }

    const equipment = await db.query.EquipmentTable.findFirst({
      where: eq(EquipmentTable.id, equipmentId),
    });

    if (!equipment) {
      throw new Error("Equipment not found");
    }

    if (equipment.workerProfileId !== workerProfile.id) {
      throw new Error("Unauthorized to edit this equipment");
    }

    const result = await db
      .update(EquipmentTable)
      .set({
        name: name,
        description: description,
      })
      .where(eq(EquipmentTable.id, equipmentId))
      .returning();

    if (result.length === 0) {
      throw new Error("Failed to edit equipment");
    }

    return { success: true, data: "Equipment edited successfully" };
  } catch (error) {
    console.log("Error subscribing to topic", error);
    return { success: false, error: error };
  }
};

export const getAllSkillsAction = async (workerId: string) => {
  try {
    const skills = await db.query.SkillsTable.findMany({
      where: eq(SkillsTable.workerProfileId, workerId),
    });
    return { success: true, data: skills };
  } catch (error) {
    console.error("Error fetching skills:", error);
    return {
      success: false,
      error: "An unexpected error occurred while fetching skills.",
    };
  }
};

export const deleteSkillWorker = async (skillId: string, token?: string) => {
  try {
    if (!token) {
      throw new Error("Authentication token is required");
    }

    const { uid } = await isUserAuthenticated(token);
    if (!uid) throw ERROR_CODES.UNAUTHORIZED;

    const user = await db.query.UsersTable.findFirst({
      where: eq(UsersTable.firebaseUid, uid),
      with: { gigWorkerProfile: { columns: { id: true } } },
    });
    
    if (!user) {
      throw new Error("User not found");
    }

    if (!user.gigWorkerProfile) {
      throw new Error("Worker profile not found");
    }

    const result = await db
      .delete(SkillsTable)
      .where(
        and(
          eq(SkillsTable.id, skillId),
          eq(SkillsTable.workerProfileId, user.gigWorkerProfile.id)
        )
      )
      .returning();

    if (result.length === 0) {
      throw new Error(
        "Failed to delete skill. It may not exist or you don't have permission."
      );
    }

    return { success: true, data: "Skill deleted successfully" };
  } catch (error: any) {
    console.error("Error deleting skill:", error);
    return {
      success: false,
      error: error.message || "Unexpected error while deleting skill",
    };
  }
};

export const updateWorkerLocationAction = async (
  location: string,
  latitude: string, 
  longitude: string,
  token?: string
) => {
  try {
    if (!token) {
      throw new Error("Auth token is required to update worker location");
    }

    const { uid } = await isUserAuthenticated(token);
    if (!uid) throw ERROR_CODES.UNAUTHORIZED;

    const user = await db.query.UsersTable.findFirst({
      where: eq(UsersTable.firebaseUid, uid),
    });

    if (!user) {
      throw new Error("User not found");
    }

    const updatedProfile = await db
      .update(GigWorkerProfilesTable)
      .set({ location, latitude, longitude })
      .where(eq(GigWorkerProfilesTable.userId, user.id))
      .returning();

    return { success: true, data: updatedProfile[0] };
  } catch (error) {
    console.error("Error updating worker location:", error);
    return { success: false, error };
  }
};
