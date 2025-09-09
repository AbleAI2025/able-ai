import { NextRequest, NextResponse } from 'next/server';
import { delegateGigToWorker } from '@/actions/gigs/delegate-gig-to-worker';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ gigId: string }> }
) {
  try {
    const { gigId } = await params;
    const body = await request.json();
    const { newWorkerId, reason } = body;
    const token = request.headers.get('authorization')?.replace('Bearer ', '') || '';

    if (!token) {
      return NextResponse.json(
        { error: 'Authorization token required' },
        { status: 401 }
      );
    }

    if (!newWorkerId) {
      return NextResponse.json(
        { error: 'New worker ID is required' },
        { status: 400 }
      );
    }

    const result = await delegateGigToWorker(token, {
      gigId,
      newWorkerId,
      reason
    });

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status || 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      data: result.data
    });

  } catch (error) {
    console.error('Error in delegate gig API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
