import React from 'react';
import { LucideIcon, Inbox } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: LucideIcon;
  actionText?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon: Icon = Inbox,
  actionText,
  onAction,
}) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 24px',
        textAlign: 'center',
        backgroundColor: '#ffffff',
        border: '1px dashed #cbd5e1',
        borderRadius: '12px',
        margin: '16px 0',
      }}
    >
      <div
        style={{
          width: '52px',
          height: '52px',
          borderRadius: '50%',
          backgroundColor: '#f1f5f9',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '14px',
          color: '#64748b',
        }}
      >
        <Icon size={26} />
      </div>

      <h4 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>
        {title}
      </h4>
      <p style={{ fontSize: '13px', color: '#64748b', maxWidth: '380px', marginBottom: actionText ? '16px' : '0' }}>
        {description}
      </p>

      {actionText && onAction && (
        <button onClick={onAction} className="btn btn-primary btn-sm">
          {actionText}
        </button>
      )}
    </div>
  );
};
