'use client';

import React from 'react';
import EscalatedIssuesDashboard from '@/components/admin/EscalatedIssuesDashboard';

export default function AdminEscalatedIssuesPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6">
        <EscalatedIssuesDashboard isAdmin={true} />
      </div>
    </div>
  );
}
