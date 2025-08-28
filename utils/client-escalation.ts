// Client-side escalation utilities - calls API routes instead of direct database access

export interface CreateEscalatedIssueParams {
  userId: string;
  issueType: string;
  description: string;
  contextType?: string;
  firestoreMessageId?: string;
  gigId?: string;
}

export interface EscalatedIssue {
  id: string;
  userId: string;
  firestoreMessageId?: string;
  gigId?: string;
  issueType: string;
  description: string;
  status: string;
  adminUserId?: string;
  resolutionNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  issueId?: string;
  issue?: EscalatedIssue;
}

// Create escalated issue via API
export async function createEscalatedIssueClient(params: CreateEscalatedIssueParams): Promise<ApiResponse> {
  try {
    const response = await fetch('/api/escalation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'create',
        ...params
      }),
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('❌ Failed to create escalated issue via API:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Update escalated issue via API
export async function updateEscalatedIssueClient(params: {
  id: string;
  status?: string;
  adminUserId?: string;
  resolutionNotes?: string;
}): Promise<ApiResponse> {
  try {
    const response = await fetch('/api/escalation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'update',
        ...params
      }),
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('❌ Failed to update escalated issue via API:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Get user's escalated issues via API
export async function getUserEscalatedIssuesClient(userId: string): Promise<ApiResponse<EscalatedIssue[]>> {
  try {
    const response = await fetch(`/api/escalation?action=user&userId=${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('❌ Failed to get user escalated issues via API:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Get open escalated issues via API
export async function getOpenEscalatedIssuesClient(): Promise<ApiResponse<EscalatedIssue[]>> {
  try {
    const response = await fetch('/api/escalation?action=open', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('❌ Failed to get open escalated issues via API:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
