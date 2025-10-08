"use server";

import { db } from "@/lib/drizzle/db";
import {
  EquipmentTable,
  QualificationsTable,
  SkillsTable,
  WorkerAvailabilityTable,
} from "@/lib/drizzle/schema";
import { eq } from "drizzle-orm";
import type { OnboardingProfileData } from "@/app/types/workerProfileTypes";

// Helper function to parse location data
export function parseLocationData(profileData: Pick<OnboardingProfileData, 'location'>) {
  let latitude = null;
  let longitude = null;
  let locationText = '';

  if (typeof profileData.location === 'string') {
    locationText = profileData.location;
    // Try to extract coordinates from the location string if it contains them
    const coordMatch = profileData.location.match(/lat[:\s]*([0-9.-]+)[,\s]*lng[:\s]*([0-9.-]+)/i);
    if (coordMatch) {
      latitude = parseFloat(coordMatch[1]);
      longitude = parseFloat(coordMatch[2]);
    }
  } else if (typeof profileData.location === 'object' && profileData.location) {
    locationText = profileData.location.formatted_address || profileData.location.name || '';
    latitude = profileData.location.lat || null;
    longitude = profileData.location.lng || null;
  }

  return { latitude, longitude, locationText };
}

// Helper function to save availability data
export async function saveAvailabilityData(userId: string, availabilityData: OnboardingProfileData['availability'], hourlyRate: string) {
  if (!availabilityData) return;

  let parsedAvailability;
  // Parse availability if it's a JSON string
  if (typeof availabilityData === "string") {
    try {
      parsedAvailability = JSON.parse(availabilityData);
    } catch (parseError) {
      console.error('Failed to parse availability JSON:', parseError);
      throw new Error('Invalid availability data format. Please try again.');
    }
  } else if (typeof availabilityData === "object") {
    parsedAvailability = availabilityData;
  }

  if (parsedAvailability) {
    // Handle array format (from existing data) - use first item
    const availabilityObject = Array.isArray(parsedAvailability) ? parsedAvailability[0] : parsedAvailability;

    if (!availabilityObject) {
      throw new Error('Availability data is empty');
    }

    // Create proper timestamps for the required fields
    const createTimestamp = (timeStr: string) => {
      if (!timeStr) {
        throw new Error('Time string is required for createTimestamp');
      }
      const [hours, minutes] = timeStr.split(":").map(Number);
      const date = new Date();
      date.setHours(hours, minutes, 0, 0);
      return date;
    };

    // Validation helper functions for enum values
    const validateFrequency = (frequency: string): "never" | "weekly" | "biweekly" | "monthly" => {
      const validFrequencies = ["never", "weekly", "biweekly", "monthly"];
      if (validFrequencies.includes(frequency)) {
        return frequency as "never" | "weekly" | "biweekly" | "monthly";
      }
      console.warn(`Invalid frequency value: ${frequency}. Defaulting to "weekly".`);
      return "weekly";
    };

    const validateEnds = (ends: string): "never" | "on_date" | "after_occurrences" => {
      const validEnds = ["never", "on_date", "after_occurrences"];
      if (validEnds.includes(ends)) {
        return ends as "never" | "on_date" | "after_occurrences";
      }
      console.warn(`Invalid ends value: ${ends}. Defaulting to "never".`);
      return "never";
    };

    await db.insert(WorkerAvailabilityTable).values({
      userId: userId,
      days: availabilityObject.days || [],
      frequency: validateFrequency(availabilityObject.frequency || "weekly"),
      startDate: availabilityObject.startDate || new Date().toISOString().split("T")[0],
      startTimeStr: availabilityObject.startTime,
      endTimeStr: availabilityObject.endTime,
      startTime: createTimestamp(availabilityObject.startTime),
      endTime: createTimestamp(availabilityObject.endTime),
      ends: validateEnds(availabilityObject.ends || "never"),
      occurrences: availabilityObject.occurrences,
      endDate: availabilityObject.endDate || null,
      notes: `Onboarding availability - Hourly Rate: ${hourlyRate}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }
}

// Helper function to extract experience years from text
export function extractExperienceYears(experienceText: string): number {
  // Try multiple patterns to extract years of experience
  let yearsMatch = experienceText.match(/(\d+)\s*(?:years?|yrs?|y)/i);

  // If no explicit years found, try to extract any number that might represent years
  if (!yearsMatch) {
    yearsMatch = experienceText.match(/(\d+)/);
  }

  // If still no number found, try to extract decimal numbers (e.g., "2.5 years")
  if (!yearsMatch) {
    yearsMatch = experienceText.match(/(\d+\.?\d*)/);
  }

  if (yearsMatch) {
    return parseFloat(yearsMatch[1]);
  } else {
    // If no number found at all, default to 0 (no experience)
    console.warn(`No years of experience found in: "${experienceText}"`);
    return 0;
  }
}

// Helper function to save skills data
export async function saveSkillsData(
  workerProfileId: string,
  skillName: string,
  yearsOfExperience: number,
  hourlyRate: string,
  hashtags: string[] | undefined,
  videoIntro?: string | File
) {
  // Check if this specific skill already exists for this worker profile to prevent exact duplicates
  const existingSkills = await db.query.SkillsTable.findMany({
    where: eq(SkillsTable.workerProfileId, workerProfileId),
  });

  // Check if this exact skill name already exists
  const skillExists = existingSkills.some(
    (skill) => skill.name.toLowerCase().trim() === skillName.toLowerCase().trim()
  );

  if (!skillExists) {
    // Skill doesn't exist, safe to insert
    try {
      await db.insert(SkillsTable).values({
        workerProfileId: workerProfileId,
        name: skillName,
        experienceMonths: 0,
        experienceYears: yearsOfExperience,
        agreedRate: hourlyRate,
        skillVideoUrl: typeof videoIntro === "string" ? videoIntro : null,
        adminTags: hashtags || null,
        ableGigs: null,
        images: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    } catch (insertError) {
      throw insertError;
    }
  }
}

// Helper function to save qualifications data
export async function saveQualificationsData(
  workerProfileId: string,
  qualificationsText: string | undefined
) {
  if (!qualificationsText || qualificationsText.trim().length === 0) return;

  // Parse qualifications from the text input
  const qualificationsList = qualificationsText
    .split(/[,\n;]/)
    .map((qual) => qual.trim())
    .filter((qual) => qual.length > 0);

  // Get existing qualifications to avoid duplicates
  const existingQualifications = await db.query.QualificationsTable.findMany({
    where: eq(QualificationsTable.workerProfileId, workerProfileId),
  });

  // Get all skills for this worker to match qualifications
  const workerSkills = await db.query.SkillsTable.findMany({
    where: eq(SkillsTable.workerProfileId, workerProfileId),
  });

  // Process qualifications and filter out duplicates
  const qualificationsToInsert = [];
  const processedTitles = new Set<string>();

  for (const qualification of qualificationsList) {
    // Try to extract year from qualification text (e.g., "Bachelor's Degree 2020")
    const yearMatch = qualification.match(/(\d{4})/);
    const yearAchieved = yearMatch ? parseInt(yearMatch[1]) : null;

    // Try to extract institution (basic pattern matching)
    const institutionMatch = qualification.match(/(?:from|at|@)\s+([^,]+)/i);
    const institution = institutionMatch ? institutionMatch[1].trim() : null;

    // Clean up the title by removing year and institution
    let title = qualification;
    if (yearMatch) {
      title = title.replace(/\d{4}/, "").trim();
    }
    if (institutionMatch) {
      title = title.replace(/(?:from|at|@)\s+[^,]+/i, "").trim();
    }

    const normalizedTitle = title.toLowerCase().trim();

    // Check if this qualification already exists (case-insensitive)
    const qualificationExists = existingQualifications.some(
      (existing) => existing.title.toLowerCase().trim() === normalizedTitle
    );

    // Also check if we've already processed this title in the current batch
    const alreadyProcessed = processedTitles.has(normalizedTitle);

    if (!qualificationExists && !alreadyProcessed) {
      // Since there's only one skill (the job title), connect all qualifications to it
      const matchedSkill = workerSkills.length > 0 ? workerSkills[0] : null;

      qualificationsToInsert.push({
        workerProfileId: workerProfileId,
        title: title || qualification, // Fallback to original if cleaning fails
        institution: institution,
        yearAchieved: yearAchieved,
        description: null, // Could be enhanced to extract more details
        documentUrl: null, // Could be enhanced to handle document uploads
        isVerifiedByAdmin: false,
        skillId: matchedSkill?.id || null, // Link to matched skill if found
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      processedTitles.add(normalizedTitle);
    }
  }

  // Insert only new qualifications
  if (qualificationsToInsert.length > 0) {
    await db.insert(QualificationsTable).values(qualificationsToInsert);
  }
}

// Helper function to save equipment data
export async function saveEquipmentData(
  workerProfileId: string,
  equipment: { name: string; description?: string }[] | undefined
) {
  if (!equipment || equipment.length === 0) return;

  // Get existing equipment to avoid duplicates
  const existingEquipment = await db.query.EquipmentTable.findMany({
    where: eq(EquipmentTable.workerProfileId, workerProfileId),
  });

  // Filter out duplicates and prepare equipment for insertion
  const equipmentToInsert = [];
  const processedNames = new Set<string>();

  for (const item of equipment as NonNullable<typeof equipment>) {
    const normalizedName = item.name.toLowerCase().trim();

    // Check if this equipment already exists (case-insensitive)
    const equipmentExists = existingEquipment.some(
      (existing) => existing.name.toLowerCase().trim() === normalizedName
    );

    // Also check if we've already processed this name in the current batch
    const alreadyProcessed = processedNames.has(normalizedName);

    if (!equipmentExists && !alreadyProcessed) {
      equipmentToInsert.push({
        workerProfileId: workerProfileId,
        name: item.name,
        description: item.description || null,
        isVerifiedByAdmin: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      processedNames.add(normalizedName);
    }
  }

  // Insert only new equipment
  if (equipmentToInsert.length > 0) {
    await db.insert(EquipmentTable).values(equipmentToInsert);
  }
}