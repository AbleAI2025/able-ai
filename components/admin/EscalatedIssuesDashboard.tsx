'use client';

import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';

interface EscalatedIssue {
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

interface EscalatedIssuesDashboardProps {
  isAdmin?: boolean;
}

export default function EscalatedIssuesDashboard({ isAdmin = false }: EscalatedIssuesDashboardProps) {
  const [issues, setIssues] = useState<EscalatedIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>('OPEN');

  useEffect(() => {
    fetchEscalatedIssues();
  }, [selectedStatus]);

  const fetchEscalatedIssues = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/escalation?action=by-status&status=${selectedStatus}`);
      const data = await response.json();
      
      if (data.success) {
        setIssues(data.issues);
      } else {
        setError(data.error || 'Failed to fetch escalated issues');
      }
    } catch (err) {
      setError('Failed to fetch escalated issues');
      console.error('Error fetching escalated issues:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateIssueStatus = async (issueId: string, newStatus: string, resolutionNotes?: string) => {
    try {
      const response = await fetch('/api/escalation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'update',
          id: issueId,
          status: newStatus,
          resolutionNotes
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        // Refresh the list
        fetchEscalatedIssues();
      } else {
        setError(data.error || 'Failed to update issue');
      }
    } catch (err) {
      setError('Failed to update issue');
      console.error('Error updating issue:', err);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN':
        return 'bg-red-100 text-red-800';
      case 'IN_PROGRESS':
        return 'bg-yellow-100 text-yellow-800';
      case 'RESOLVED':
        return 'bg-green-100 text-green-800';
      case 'CLOSED':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getIssueTypeColor = (issueType: string) => {
    switch (issueType) {
      case 'payment_issue':
        return 'bg-purple-100 text-purple-800';
      case 'technical_problem':
        return 'bg-blue-100 text-blue-800';
      case 'user_frustration':
        return 'bg-orange-100 text-orange-800';
      case 'safety_concern':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (!isAdmin) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-medium">Access Denied</h3>
          <p className="text-red-600">You don't have permission to view this dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Escalated Issues Dashboard</h1>
        <p className="text-gray-600">Monitor and manage issues escalated from AI chat interactions</p>
      </div>

      {/* Status Filter */}
      <div className="mb-6">
        <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-2">
          Filter by Status
        </label>
        <select
          id="status-filter"
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="block w-full max-w-xs rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        >
          <option value="OPEN">Open</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="RESOLVED">Resolved</option>
          <option value="CLOSED">Closed</option>
        </select>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      )}

      {/* Issues List */}
      {!loading && issues.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">No escalated issues found with status "{selectedStatus}"</p>
        </div>
      )}

      {!loading && issues.length > 0 && (
        <div className="space-y-4">
          {issues.map((issue) => (
            <div key={issue.id} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(issue.status)}`}>
                      {issue.status}
                    </span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getIssueTypeColor(issue.issueType)}`}>
                      {issue.issueType.replace('_', ' ')}
                    </span>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Issue #{issue.id.slice(0, 8)}
                  </h3>
                  <p className="text-gray-600 mb-2">{issue.description}</p>
                  <div className="text-sm text-gray-500">
                    <p>User ID: {issue.userId}</p>
                    {issue.gigId && <p>Gig ID: {issue.gigId}</p>}
                    <p>Created: {format(new Date(issue.createdAt), 'PPP p')}</p>
                    <p>Updated: {format(new Date(issue.updatedAt), 'PPP p')}</p>
                  </div>
                </div>
              </div>

              {/* Resolution Notes */}
              {issue.resolutionNotes && (
                <div className="mb-4 p-3 bg-gray-50 rounded-md">
                  <h4 className="text-sm font-medium text-gray-700 mb-1">Resolution Notes</h4>
                  <p className="text-sm text-gray-600">{issue.resolutionNotes}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2">
                {issue.status === 'OPEN' && (
                  <>
                    <button
                      onClick={() => updateIssueStatus(issue.id, 'IN_PROGRESS')}
                      className="px-3 py-1 text-sm bg-yellow-600 text-white rounded hover:bg-yellow-700"
                    >
                      Start Working
                    </button>
                    <button
                      onClick={() => updateIssueStatus(issue.id, 'RESOLVED')}
                      className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                    >
                      Mark Resolved
                    </button>
                  </>
                )}
                {issue.status === 'IN_PROGRESS' && (
                  <button
                    onClick={() => updateIssueStatus(issue.id, 'RESOLVED')}
                    className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    Mark Resolved
                  </button>
                )}
                {issue.status === 'RESOLVED' && (
                  <button
                    onClick={() => updateIssueStatus(issue.id, 'CLOSED')}
                    className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700"
                  >
                    Close Issue
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Refresh Button */}
      <div className="mt-6">
        <button
          onClick={fetchEscalatedIssues}
          className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
        >
          Refresh
        </button>
      </div>
    </div>
  );
}
