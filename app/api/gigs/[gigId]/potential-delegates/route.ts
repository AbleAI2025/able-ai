import { NextRequest, NextResponse } from 'next/server';
import { searchWorkersForDelegation } from '@/actions/gigs/search-workers-for-delegation';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ gigId: string }> }
) {
  try {
    const { gigId } = await params;
    const { searchParams } = new URL(request.url);
    const searchTerm = searchParams.get('search') || '';
    const token = request.headers.get('authorization')?.replace('Bearer ', '') || '';

    if (!token) {
      return NextResponse.json(
        { error: 'Authorization token required' },
        { status: 401 }
      );
    }

    const result = await searchWorkersForDelegation(token, gigId, searchTerm);

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status || 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      count: result.count
    });

  } catch (error) {
    console.error('Error in potential delegates API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
