"use server";
import { db } from "@/lib/drizzle/db";
import {
  EquipmentTable,
  GigWorkerProfilesTable,
  QualificationsTable,
  SkillsTable,
  UsersTable,
} from "@/lib/drizzle/schema";
import { ERROR_CODES, ERROR_MESSAGES } from "@/lib/responses/errors";
import { isUserAuthenticated } from "@/lib/user.server";
import { and, eq } from "drizzle-orm";


/**
 * Standard response types
 */
interface ActionResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Helper function to authenticate and fetch worker profile
 */
async function authenticateAndGetWorkerProfile(token: string): Promise<{ user: typeof UsersTable.$inferSelect; workerProfile: typeof GigWorkerProfilesTable.$inferSelect }> {
  if (!token) throw new Error(ERROR_MESSAGES.TOKEN_REQUIRED.message);
  const { uid } = await isUserAuthenticated(token);
  if (!uid) throw new Error(ERROR_CODES.UNAUTHORIZED.message);

  const user = await db.query.UsersTable.findFirst({
    where: eq(UsersTable.firebaseUid, uid),
  });
  if (!user) throw new Error(ERROR_MESSAGES.USER_NOT_FOUND.message);

  const workerProfile = await db.query.GigWorkerProfilesTable.findFirst({
    where: eq(GigWorkerProfilesTable.userId, user.id),
  });
  if (!workerProfile) throw new Error(ERROR_MESSAGES.WORKER_PROFILE_NOT_FOUND.message);

  return { user, workerProfile };
}

/**
 * Helper for ownership validation
 */
function validateOwnership(ownerId: string, resourceOwnerId: string): void {
  if (ownerId !== resourceOwnerId) {
    throw new Error(ERROR_MESSAGES.UNAUTHORIZED.message);
  }
}

/**
 * Creates a new qualification for the authenticated worker.
 */
export const addQualificationAction = async (
  title: string,
  token: string,
  skillId?: string,
  description?: string,
  institution?: string,
  documentUrl?: string
): Promise<ActionResponse<string>> => {
  try {
    if (!skillId) throw new Error(ERROR_MESSAGES.SKILL_ID_REQUIRED.message);

    const { workerProfile } = await authenticateAndGetWorkerProfile(token!);

    const result = await db
      .insert(QualificationsTable)
      .values({
        workerProfileId: workerProfile.id,
        title,
        description,
        institution,
        documentUrl,
        skillId,
        yearAchieved: new Date().getFullYear(),
      })
      .returning();

    if (result.length === 0) throw new Error(ERROR_MESSAGES.FAILED_TO_CREATE.message);

    return { success: true, data: "Calificación creada exitosamente" };
  } catch (error) {
    console.error("Error al agregar calificación:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : ERROR_MESSAGES.FAILED_TO_CREATE.message,
    };
  }
};

/**
 * Deletes a qualification if the authenticated worker owns it.
 */
export const deleteQualificationAction = async (
  qualificationId: string,
  token: string
): Promise<ActionResponse<string>> => {
  try {
    const { workerProfile } = await authenticateAndGetWorkerProfile(token!);

    const qualification = await db.query.QualificationsTable.findFirst({
      where: eq(QualificationsTable.id, qualificationId),
    });
    if (!qualification) throw new Error(ERROR_MESSAGES.QUALIFICATION_NOT_FOUND.message);

    validateOwnership(qualification.workerProfileId, workerProfile.id);

    const result = await db
      .delete(QualificationsTable)
      .where(eq(QualificationsTable.id, qualificationId))
      .returning();

    if (result.length === 0) throw new Error(ERROR_MESSAGES.FAILED_TO_DELETE.message);

    return { success: true, data: "Calificación eliminada exitosamente" };
  } catch (error) {
    console.error("Error al eliminar calificación:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : ERROR_MESSAGES.FAILED_TO_DELETE.message,
    };
  }
};

/**
 * Edits a qualification if the authenticated worker owns it.
 */
export const editQualificationAction = async (
  qualificationId: string,
  title: string,
  token: string,
  description?: string,
  institution?: string,
  documentUrl?: string
): Promise<ActionResponse<string>> => {
  try {
    const { workerProfile } = await authenticateAndGetWorkerProfile(token!);

    const qualification = await db.query.QualificationsTable.findFirst({
      where: eq(QualificationsTable.id, qualificationId),
    });
    if (!qualification) throw new Error(ERROR_MESSAGES.QUALIFICATION_NOT_FOUND.message);

    validateOwnership(qualification.workerProfileId, workerProfile.id);

    const result = await db
      .update(QualificationsTable)
      .set({
        title,
        description,
        institution,
        documentUrl,
      })
      .where(eq(QualificationsTable.id, qualificationId))
      .returning();

    if (result.length === 0) throw new Error(ERROR_MESSAGES.FAILED_TO_EDIT.message);

    return { success: true, data: "Calificación editada exitosamente" };
  } catch (error) {
    console.error("Error al editar calificación:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : ERROR_MESSAGES.FAILED_TO_EDIT.message,
    };
  }
};

/**
 * Creates a new equipment for the authenticated worker.
 */
export const addEquipmentAction = async (
  name: string,
  token: string,
  description?: string
): Promise<ActionResponse<string>> => {
  try {
    const { workerProfile } = await authenticateAndGetWorkerProfile(token!);

    const result = await db
      .insert(EquipmentTable)
      .values({
        name,
        description,
        workerProfileId: workerProfile.id,
      })
      .returning();

    if (result.length === 0) throw new Error(ERROR_MESSAGES.FAILED_TO_CREATE.message);

    return { success: true, data: "Equipo creado exitosamente" };
  } catch (error) {
    console.error("Error al agregar equipo:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : ERROR_MESSAGES.FAILED_TO_CREATE.message,
    };
  }
};

/**
 * Deletes equipment if the authenticated worker owns it.
 */
export const deleteEquipmentAction = async (
  equipmentId: string,
  token: string
): Promise<ActionResponse<string>> => {
  try {
    const { workerProfile } = await authenticateAndGetWorkerProfile(token!);

    const equipment = await db.query.EquipmentTable.findFirst({
      where: eq(EquipmentTable.id, equipmentId),
    });
    if (!equipment) throw new Error(ERROR_MESSAGES.EQUIPMENT_NOT_FOUND.message);

    validateOwnership(equipment.workerProfileId, workerProfile.id);

    const result = await db
      .delete(EquipmentTable)
      .where(eq(EquipmentTable.id, equipmentId))
      .returning();

    if (result.length === 0) throw new Error(ERROR_MESSAGES.FAILED_TO_DELETE.message);

    return { success: true, data: "Equipo eliminado exitosamente" };
  } catch (error) {
    console.error("Error al eliminar equipo:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : ERROR_MESSAGES.FAILED_TO_DELETE.message,
    };
  }
};

/**
 * Edits equipment if the authenticated worker owns it.
 */
export const editEquipmentAction = async (
  equipmentId: string,
  name: string,
  token: string,
  description?: string
): Promise<ActionResponse<string>> => {
  try {
    const { workerProfile } = await authenticateAndGetWorkerProfile(token!);

    const equipment = await db.query.EquipmentTable.findFirst({
      where: eq(EquipmentTable.id, equipmentId),
    });
    if (!equipment) throw new Error(ERROR_MESSAGES.EQUIPMENT_NOT_FOUND.message);

    validateOwnership(equipment.workerProfileId, workerProfile.id);

    const result = await db
      .update(EquipmentTable)
      .set({
        name,
        description,
      })
      .where(eq(EquipmentTable.id, equipmentId))
      .returning();

    if (result.length === 0) throw new Error(ERROR_MESSAGES.FAILED_TO_EDIT.message);

    return { success: true, data: "Equipo editado exitosamente" };
  } catch (error) {
    console.error("Error al editar equipo:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : ERROR_MESSAGES.FAILED_TO_EDIT.message,
    };
  }
};

/**
 * Fetches all skills for a given worker profile.
 */
export const getAllSkillsAction = async (workerId: string): Promise<ActionResponse<any[]>> => {
  try {
    const skills = await db.query.SkillsTable.findMany({
      where: eq(SkillsTable.workerProfileId, workerId),
    });
    return { success: true, data: skills };
  } catch (error) {
    console.error("Error al obtener habilidades:", error);
    return {
      success: false,
      error: "Error inesperado al obtener habilidades.",
    };
  }
};

/**
 * Deletes a skill if the authenticated worker owns it.
 */
export const deleteSkillWorker = async (skillId: string, token: string): Promise<ActionResponse<string>> => {
  try {
    const { workerProfile } = await authenticateAndGetWorkerProfile(token);

    const result = await db
      .delete(SkillsTable)
      .where(
        and(
          eq(SkillsTable.id, skillId),
          eq(SkillsTable.workerProfileId, workerProfile.id)
        )
      )
      .returning();

    if (result.length === 0) throw new Error(ERROR_MESSAGES.FAILED_TO_DELETE.message);

    return { success: true, data: "Habilidad eliminada exitosamente" };
  } catch (error) {
    console.error("Error al eliminar habilidad:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error inesperado al eliminar habilidad",
    };
  }
};

/**
 * Updates the worker's location.
 */
export const updateWorkerLocationAction = async (
  location: string,
  latitude: string,
  longitude: string,
  token: string
): Promise<ActionResponse<any>> => {
  try {
    const { user } = await authenticateAndGetWorkerProfile(token);

    const updatedProfile = await db
      .update(GigWorkerProfilesTable)
      .set({ location, latitude, longitude })
      .where(eq(GigWorkerProfilesTable.userId, user.id))
      .returning();

    return { success: true, data: updatedProfile[0] };
  } catch (error) {
    console.error("Error al actualizar ubicación del trabajador:", error);
    return { success: false, error: error instanceof Error ? error.message : "Error al actualizar ubicación" };
  }
};
