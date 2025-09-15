import { NextRequest, NextResponse } from 'next/server';
import { getGigDetails } from '@/actions/gigs/get-gig-details';
import { isUserAuthenticated } from '@/lib/user.server';
import { db } from '@/lib/drizzle/db';
import { UsersTable } from '@/lib/drizzle/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ gigId: string }> }
) {
  try {
    const { gigId } = await params;
    
    if (!gigId) {
      return NextResponse.json(
        { error: 'Gig ID is required' },
        { status: 400 }
      );
    }

    // Get the JWT token from the Authorization header
    const token = request.headers.get('authorization')?.replace('Bearer ', '') || '';
    
    if (!token) {
      return NextResponse.json(
        { error: 'Authorization token required' },
        { status: 401 }
      );
    }

    // Verify the JWT token and get the user's Firebase UID
    let firebaseUid: string;
    try {
      const authResult = await isUserAuthenticated(token);
      firebaseUid = authResult.uid;
    } catch (error) {
      console.error('Authentication failed:', error);
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Get the user from the database using the Firebase UID
    const user = await db.query.UsersTable.findFirst({
      where: eq(UsersTable.firebaseUid, firebaseUid),
      columns: {
        id: true,
        appRole: true,
        isBuyer: true,
        isGigWorker: true,
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Determine the role based on the user's role in the database
    const role = user.isBuyer ? 'buyer' : 'worker';

    const result = await getGigDetails({
      gigId,
      userId: firebaseUid, // Use Firebase UID as expected by getGigDetails
      role,
      isViewQA: false
    });

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status }
      );
    }

    // Transform the gig data to match the expected format for the amend page
    const gigData = {
      id: result.gig.id,
      gigDescription: result.gig.specialInstructions || '',
      gigDate: result.gig.date,
      gigTime: `${result.gig.startTime} - ${result.gig.endTime}`,
      hourlyRate: result.gig.hourlyRate,
      location: result.gig.location,
      statusInternal: result.gig.statusInternal,
      buyerId: result.gig.buyerName, // This might need adjustment
      workerId: result.gig.workerName || '', // This might need adjustment
    };

    return NextResponse.json(gigData);

  } catch (error) {
    console.error('Error fetching gig:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
