// File: lib/utils/availabilityValidation.ts

import { db } from "@/lib/drizzle/db";
import { WorkerAvailabilityTable, GigsTable } from "@/lib/drizzle/schema";
import { eq, and, or, lt, gt } from "drizzle-orm";

export interface AvailabilityTimeRange {
  startTime: Date;
  endTime: Date;
  userId: string;
  excludeId?: string; // For updates, exclude the current record
}

/**
 * Validates that startTime is before endTime
 */
export function validateTimeRange(startTime: Date, endTime: Date): boolean {
  return startTime < endTime;
}

/**
 * Checks for overlapping availability periods for the same user
 * Returns true if there's an overlap, false otherwise
 */
export async function checkAvailabilityOverlap({
  startTime,
  endTime,
  userId,
  excludeId
}: AvailabilityTimeRange): Promise<boolean> {
  const conditions = [
    eq(WorkerAvailabilityTable.userId, userId),
    // Check for overlap: new start < existing end AND new end > existing start
    and(
      lt(WorkerAvailabilityTable.startTime, endTime),
      gt(WorkerAvailabilityTable.endTime, startTime)
    )
  ];

  // Exclude current record if updating
  if (excludeId) {
    conditions.push(eq(WorkerAvailabilityTable.id, excludeId));
  }

  const overlappingRecords = await db.query.WorkerAvailabilityTable.findMany({
    where: and(...conditions),
    columns: { id: true }
  });

  return overlappingRecords.length > 0;
}

/**
 * Checks for overlap with accepted gigs for the same user
 * Returns true if there's an overlap, false otherwise
 */
export async function checkGigOverlap({
  startTime,
  endTime,
  userId,
  excludeId
}: AvailabilityTimeRange): Promise<boolean> {
  const conditions = [
    eq(GigsTable.workerUserId, userId),
    // Only check accepted gigs
    eq(GigsTable.statusInternal, 'ACCEPTED'),
    // Check for overlap: new start < gig end AND new end > gig start
    and(
      lt(GigsTable.startTime, endTime),
      gt(GigsTable.endTime, startTime)
    )
  ];

  const overlappingGigs = await db.query.GigsTable.findMany({
    where: and(...conditions),
    columns: { id: true }
  });

  return overlappingGigs.length > 0;
}

/**
 * Comprehensive validation for availability creation/update
 */
export async function validateAvailability({
  startTime,
  endTime,
  userId,
  excludeId,
  checkGigConflicts = true
}: AvailabilityTimeRange & { checkGigConflicts?: boolean }): Promise<{
  isValid: boolean;
  errors: string[];
}> {
  const errors: string[] = [];

  // Validate time range
  if (!validateTimeRange(startTime, endTime)) {
    errors.push("Start time must be before end time");
  }

  // Check for availability overlaps
  const hasAvailabilityOverlap = await checkAvailabilityOverlap({
    startTime,
    endTime,
    userId,
    excludeId
  });

  if (hasAvailabilityOverlap) {
    errors.push("This time period overlaps with an existing availability period");
  }

  // Check for gig conflicts (optional)
  if (checkGigConflicts) {
    const hasGigOverlap = await checkGigOverlap({
      startTime,
      endTime,
      userId,
      excludeId
    });

    if (hasGigOverlap) {
      errors.push("This time period overlaps with an accepted gig");
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}
