import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/drizzle/db';
import { UsersTable, GigWorkerProfilesTable, SkillsTable } from '@/lib/drizzle/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ workerId: string }> }
) {
  try {
    const { workerId } = await params;

    if (!workerId) {
      return NextResponse.json(
        { error: 'Worker ID is required' },
        { status: 400 }
      );
    }

    // Get worker user details
    const user = await db.query.UsersTable.findFirst({
      where: eq(UsersTable.id, workerId),
      columns: {
        id: true,
        fullName: true,
        email: true,
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Worker not found' },
        { status: 404 }
      );
    }

    // Get worker profile
    const workerProfile = await db.query.GigWorkerProfilesTable.findFirst({
      where: eq(GigWorkerProfilesTable.userId, user.id),
    });

    // Get primary skill (first skill or default)
    const skills = await db.query.SkillsTable.findMany({
      where: eq(SkillsTable.workerProfileId, workerProfile?.id || ''),
      limit: 1,
    });

    const primarySkill = skills[0]?.name || 'Professional';

    return NextResponse.json({
      success: true,
      data: {
        id: user.id,
        name: user.fullName || 'Unknown Worker',
        email: user.email,
        primarySkill,
        bio: workerProfile?.fullBio,
      }
    });

  } catch (error) {
    console.error('Error fetching worker details:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
