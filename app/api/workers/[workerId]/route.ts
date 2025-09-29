import { NextResponse } from 'next/server';
import { db } from '@/lib/drizzle/db';
import { GigWorkerProfilesTable } from '@/lib/drizzle/schema';
import { eq } from 'drizzle-orm';

export async function GET(
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

    const workerProfile = await db.query.GigWorkerProfilesTable.findFirst({
      where: eq(GigWorkerProfilesTable.id, workerId),
      with: {
        user: {
          columns: {
            fullName: true,
          },
        },
        skills: {
          columns: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!workerProfile) {
      return NextResponse.json(
        { error: 'Worker profile not found' },
        { status: 404 }
      );
    }

    if (!workerProfile.user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        name: workerProfile.user.fullName,
        skills: workerProfile.skills,
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
