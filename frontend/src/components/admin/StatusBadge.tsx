/**
 * StatusBadge Component
 * Strictly maps backend TaskStatus to human-friendly display labels while preserving API contract.
 */
import React from 'react';
import { TaskStatus } from '../../types/shared';
import { Clock, UserCheck, CheckCircle2, Play, FileCheck, XCircle, Ban } from 'lucide-react';

interface StatusBadgeProps {
  status: TaskStatus | string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const isSm = size === 'sm';
  const iconSize = isSm ? 12 : 14;

  switch (status) {
    case 'pending':
      return (
        <span className={`badge badge-neutral ${isSm ? 'text-xs py-0.5 px-2' : ''}`}>
          <Clock size={iconSize} className="text-slate-500" />
          Pending
        </span>
      );
    case 'assigned':
      return (
        <span className={`badge badge-low ${isSm ? 'text-xs py-0.5 px-2' : ''}`}>
          <UserCheck size={iconSize} className="text-blue-600" />
          Assigned
        </span>
      );
    case 'accepted':
      return (
        <span className={`badge badge-low ${isSm ? 'text-xs py-0.5 px-2' : ''}`}>
          <CheckCircle2 size={iconSize} className="text-blue-600" />
          Accepted
        </span>
      );
    case 'active':
      return (
        <span className={`badge badge-medium ${isSm ? 'text-xs py-0.5 px-2' : ''}`}>
          <Play size={iconSize} className="text-amber-600" />
          In Progress
        </span>
      );
    case 'completion_submitted':
      return (
        <span className={`badge badge-ai ${isSm ? 'text-xs py-0.5 px-2' : ''}`}>
          <FileCheck size={iconSize} className="text-purple-600" />
          Verification Needed
        </span>
      );
    case 'verified':
      return (
        <span className={`badge badge-success ${isSm ? 'text-xs py-0.5 px-2' : ''}`}>
          <CheckCircle2 size={iconSize} className="text-emerald-600" />
          Verified Closed
        </span>
      );
    case 'rejected':
      return (
        <span className={`badge badge-high ${isSm ? 'text-xs py-0.5 px-2' : ''}`}>
          <XCircle size={iconSize} className="text-rose-600" />
          Assignment Declined
        </span>
      );
    case 'cancelled':
      return (
        <span className={`badge badge-neutral ${isSm ? 'text-xs py-0.5 px-2' : ''}`}>
          <Ban size={iconSize} className="text-slate-400" />
          Cancelled
        </span>
      );
    default:
      return (
        <span className={`badge badge-neutral ${isSm ? 'text-xs py-0.5 px-2' : ''}`}>
          {status}
        </span>
      );
  }
};
