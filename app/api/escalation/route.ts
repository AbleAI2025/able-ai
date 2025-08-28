import { NextRequest, NextResponse } from 'next/server';
import { 
  createEscalatedIssue, 
  updateEscalatedIssue, 
  getUserEscalatedIssues, 
  getOpenEscalatedIssues,
  getEscalatedIssuesByStatus,
  deleteEscalatedIssue 
} from '@/actions/escalation';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...params } = body;

    switch (action) {
      case 'create':
        const createResult = await createEscalatedIssue(params);
        if (createResult.success) {
          return NextResponse.json({ 
            success: true, 
            issueId: createResult.issueId,
            issue: createResult.issue 
          });
        } else {
          return NextResponse.json(
            { success: false, error: createResult.error },
            { status: 500 }
          );
        }

      case 'update':
        const updateResult = await updateEscalatedIssue(params);
        if (updateResult.success) {
          return NextResponse.json({ 
            success: true, 
            issue: updateResult.issue 
          });
        } else {
          return NextResponse.json(
            { success: false, error: updateResult.error },
            { status: 500 }
          );
        }

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('❌ Escalation API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const userId = searchParams.get('userId');
    const status = searchParams.get('status');

    switch (action) {
      case 'user':
        if (!userId) {
          return NextResponse.json(
            { success: false, error: 'User ID required' },
            { status: 400 }
          );
        }
        const userIssues = await getUserEscalatedIssues(userId);
        return NextResponse.json(userIssues);

      case 'open':
        const openIssues = await getOpenEscalatedIssues();
        return NextResponse.json(openIssues);

      case 'by-status':
        if (!status) {
          return NextResponse.json(
            { success: false, error: 'Status required' },
            { status: 400 }
          );
        }
        const statusIssues = await getEscalatedIssuesByStatus(status);
        return NextResponse.json(statusIssues);

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('❌ Escalation API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Issue ID required' },
        { status: 400 }
      );
    }

    const deleteResult = await deleteEscalatedIssue(id);
    return NextResponse.json(deleteResult);
  } catch (error) {
    console.error('❌ Escalation API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
