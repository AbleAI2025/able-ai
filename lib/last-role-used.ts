"use client";
export async function setLastRoleUsed(lastRoleUsed: "BUYER" | "GIG_WORKER") {
  try {
    window.localStorage.setItem("lastRoleUsed", lastRoleUsed);

    return null;
  } catch (error) {
    console.log("Error updating last role used:", error);
  }
}
export function getLastRoleUsed(): "BUYER" | "GIG_WORKER" | null {
  try {
    const lastRoleUsed = window.localStorage.getItem("lastRoleUsed");
    
    return lastRoleUsed as "BUYER" | "GIG_WORKER" | null;
  } catch (error) {
    console.log("Error retrieving last role used:", error);
    return null;
  }
}