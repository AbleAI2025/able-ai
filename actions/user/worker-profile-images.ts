"use server";

import { db } from "@/lib/drizzle/db";
import { SkillsTable } from "@/lib/drizzle/schema";

import { ERROR_CODES } from "@/lib/responses/errors";
import { isUserAuthenticated } from "@/lib/user.server";
import { eq } from "drizzle-orm";

export const updateProfileImageAction = async (
  token: string,
  id: string,
  newImage: string
) => {
  try {
    if (!token) throw new Error("User ID is required");

    const { uid } = await isUserAuthenticated(token);
    if (!uid) throw ERROR_CODES.UNAUTHORIZED;

    const skill = await db.query.SkillsTable.findFirst({
      where: eq(SkillsTable.id, id),
      columns: { images: true },
    });

    const updatedImages = [...(skill?.images ?? []), newImage];

    await db
      .update(SkillsTable)
      .set({
        images: updatedImages,
        updatedAt: new Date(),
      })
      .where(eq(SkillsTable.id, id));

    return { success: true, data: updatedImages };
  } catch (error) {
    return { success: false, data: null, error };
  }
};

export const deleteImageAction = async (
  token: string,
  skillId: string,
  imageUrl: string
) => {
  try {
    if (!token) throw new Error("User ID is required");

    const { uid } = await isUserAuthenticated(token);
    if (!uid) throw ERROR_CODES.UNAUTHORIZED;

    const skill = await db.query.SkillsTable.findFirst({
      where: eq(SkillsTable.id, skillId),
      columns: { images: true },
    });

    if (!skill) throw "Skill not found";

    const updatedImages = skill?.images?.filter((img) => img !== imageUrl);

    await db
      .update(SkillsTable)
      .set({
        images: updatedImages,
        updatedAt: new Date(),
      })
      .where(eq(SkillsTable.id, skillId));

    return { success: true, data: updatedImages };
  } catch (error) {
    return { success: false, data: null, error };
  }
};