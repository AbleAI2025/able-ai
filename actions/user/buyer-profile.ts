import { db } from "@/lib/drizzle/db";
import { TeamMembersTable, UsersTable } from "@/lib/drizzle/schema";
import { ERROR_CODES } from "@/lib/responses/errors";
import { isUserAuthenticated } from "@/lib/user.server";
import { eq } from "drizzle-orm";

export const getBuyerProfile = async (token: string) => {
  if (!token) {
    throw new Error("User ID is required to fetch buyer profile");
  }

    const { uid } = await isUserAuthenticated(token);
    if (!uid) throw ERROR_CODES.UNAUTHORIZED;

  try {
    const user = await db.query.BuyerProfilesTable.findFirst({
      where: eq(UsersTable.firebaseUid, uid),
      columns: {
        id: true,
        userId: true,
        fullCompanyName: true,
        billingAddressJson: true,
        businessRegistrationNumber: true,
        vatNumber: true,
      },
    });

    const teamMembers = await db.query.TeamMembersTable.findMany({
      where: eq(TeamMembersTable.buyerProfileId, user?.userId || ""),
      columns: {
        id: true,
        name: true,
        email: true,
        roleInTeam: true,
        permissionsJson: true,

      },
    });

    if (!user) {
      throw new Error("User not found");
    }

    const data = {...user, teamMembers };

    return {success: true, data};
  } catch (error) {
    console.error("Error fetching buyer profile:", error);
    throw error;
  }
}