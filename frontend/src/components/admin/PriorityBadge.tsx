/**
 * PriorityBadge Component
 * Formats priorities (critical, high, medium, low) with clear visual semantics
 */
import React from 'react';
import { Priority } from '../../types/shared';
import { AlertTriangle, AlertCircle, Info } from 'lucide-react';

interface PriorityBadgeProps {
  priority: Priority | 'critical' | string;
  size?: 'sm' | 'md';
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority, size = 'md' }) => {
  const isSm = size === 'sm';
  const iconSize = isSm ? 12 : 13;

  switch (priority.toLowerCase()) {
    case 'critical':
      return (
        <span className={`badge badge-high ${isSm ? 'text-xs py-0.5 px-2' : ''}`} style={{ backgroundColor: '#ffe4e6', color: '#e11d48', borderColor: '#fda4af' }}>
          <AlertCircle size={iconSize} className="text-rose-600 animate-pulse" />
          Critical
        </span>
      );
    case 'high':
      return (
        <span className={`badge badge-high ${isSm ? 'text-xs py-0.5 px-2' : ''}`}>
          <AlertTriangle size={iconSize} className="text-red-500" />
          High
        </span>
      );
    case 'medium':
      return (
        <span className={`badge badge-medium ${isSm ? 'text-xs py-0.5 px-2' : ''}`}>
          <AlertCircle size={iconSize} className="text-amber-500" />
          Medium
        </span>
      );
    case 'low':
    default:
      return (
        <span className={`badge badge-low ${isSm ? 'text-xs py-0.5 px-2' : ''}`}>
          <Info size={iconSize} className="text-blue-500" />
          Low
        </span>
      );
  }
};
