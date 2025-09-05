"use server";
import { db } from "@/lib/drizzle/db";
import { EquipmentTable, GigWorkerProfilesTable, QualificationsTable, UsersTable } from "@/lib/drizzle/schema";
import { ERROR_CODES } from "@/lib/responses/errors";
import { isUserAuthenticated } from "@/lib/user.server";
import { eq } from "drizzle-orm";

export const addQualificationAction = async (
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

    const result = await db
      .insert(QualificationsTable)
      .values({
        workerProfileId: workerProfile.id,
        title: title,
        description: description,
        institution: institution,
        documentUrl: documentUrl,
        yearAchieved: new Date().getFullYear(),
      })
      .returning();

    if (result.length === 0) {
      throw new Error("Failed to add qualification");
    }

    return { success: true, data: "Qualification created successfully" };
  } catch (error) {
        console.log("Error subscribing to topic", error);
    return { success: false, error: error };
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
        description: "",
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