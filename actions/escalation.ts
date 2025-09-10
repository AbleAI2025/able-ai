import { db } from '@/lib/drizzle/db';
import { escalatedIssues } from '@/lib/drizzle/schema/ai';
import { UsersTable } from '@/lib/drizzle/schema/users';
import { eq } from 'drizzle-orm';

export interface CreateEscalatedIssueParams {
  userId: string;
  firestoreMessageId?: string;
  gigId?: string;
  issueType: string;
  description: string;
  contextType?: 'onboarding' | 'support' | 'gig_issue' | 'payment' | 'technical';
}

export interface UpdateEscalatedIssueParams {
  id: string;
  status?: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  adminUserId?: string;
  resolutionNotes?: string;
}

/**
 * Create a new escalated issue in the database
 */
export async function createEscalatedIssue(params: CreateEscalatedIssueParams) {
  try {
    // First, find the user by Firebase UID to get the database UUID
    const user = await db.query.UsersTable.findFirst({
      where: eq(UsersTable.firebaseUid, params.userId),
    });

    if (!user) {
      console.error('❌ User not found for Firebase UID:', params.userId);
      return { success: false, error: 'User not found' };
    }

    const [newIssue] = await db
      .insert(escalatedIssues)
      .values({
        userId: user.id, // Use the database UUID, not the Firebase UID
        firestoreMessageId: params.firestoreMessageId,
        gigId: params.gigId,
        issueType: params.issueType,
        description: params.description,
        status: 'OPEN',
      })
      .returning();

    console.log('✅ Escalated issue created:', newIssue.id);
    return { success: true, issueId: newIssue.id, issue: newIssue };
  } catch (error) {
    console.error('❌ Failed to create escalated issue:', error);
    return { success: false, error: 'Failed to create escalated issue' };
  }
}

/**
 * Update an existing escalated issue
 */
export async function updateEscalatedIssue(params: UpdateEscalatedIssueParams) {
  try {
    const updateData: any = {};
    if (params.status) updateData.status = params.status;
    if (params.adminUserId) updateData.adminUserId = params.adminUserId;
    if (params.resolutionNotes) updateData.resolutionNotes = params.resolutionNotes;
    updateData.updatedAt = new Date();

    const [updatedIssue] = await db
      .update(escalatedIssues)
      .set(updateData)
      .where(eq(escalatedIssues.id, params.id))
      .returning();

    console.log('✅ Escalated issue updated:', params.id);
    return { success: true, issue: updatedIssue };
  } catch (error) {
    console.error('❌ Failed to update escalated issue:', error);
    return { success: false, error: 'Failed to update escalated issue' };
  }
}

/**
 * Get escalated issues for a user
 */
export async function getUserEscalatedIssues(userId: string) {
  try {
    const issues = await db
      .select()
      .from(escalatedIssues)
      .where(eq(escalatedIssues.userId, userId))
      .orderBy(escalatedIssues.createdAt);

    return { success: true, issues };
  } catch (error) {
    console.error('❌ Failed to get user escalated issues:', error);
    return { success: false, error: 'Failed to get escalated issues' };
  }
}

/**
 * Get all open escalated issues (for admin dashboard)
 */
export async function getOpenEscalatedIssues() {
  try {
    const issues = await db
      .select()
      .from(escalatedIssues)
      .where(eq(escalatedIssues.status, 'OPEN'))
      .orderBy(escalatedIssues.createdAt);

    return { success: true, issues };
  } catch (error) {
    console.error('❌ Failed to get open escalated issues:', error);
    return { success: false, error: 'Failed to get open escalated issues' };
  }
}

/**
 * Get escalated issues by status
 */
export async function getEscalatedIssuesByStatus(status: string) {
  try {
    const issues = await db
      .select()
      .from(escalatedIssues)
      .where(eq(escalatedIssues.status, status))
      .orderBy(escalatedIssues.createdAt);

    return { success: true, issues };
  } catch (error) {
    console.error('❌ Failed to get escalated issues by status:', error);
    return { success: false, error: 'Failed to get escalated issues' };
  }
}

/**
 * Delete an escalated issue (for cleanup)
 */
export async function deleteEscalatedIssue(id: string) {
  try {
    await db
      .delete(escalatedIssues)
      .where(eq(escalatedIssues.id, id));

    console.log('✅ Escalated issue deleted:', id);
    return { success: true };
  } catch (error) {
    console.error('❌ Failed to delete escalated issue:', error);
    return { success: false, error: 'Failed to delete escalated issue' };
  }
}
