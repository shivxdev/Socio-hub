import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Failed to load operational data',
  message,
  onRetry,
}) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '36px 20px',
        textAlign: 'center',
        backgroundColor: '#fff1f2',
        border: '1px solid #fecdd3',
        borderRadius: '12px',
        margin: '16px 0',
      }}
    >
      <div
        style={{
          width: '46px',
          height: '46px',
          borderRadius: '50%',
          backgroundColor: '#ffe4e6',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '12px',
          color: '#e11d48',
        }}
      >
        <AlertCircle size={24} />
      </div>

      <h4 style={{ fontSize: '15px', fontWeight: 700, color: '#9f1239', marginBottom: '4px' }}>
        {title}
      </h4>
      <p style={{ fontSize: '13px', color: '#be123c', maxWidth: '440px', marginBottom: onRetry ? '16px' : '0' }}>
        {message}
      </p>

      {onRetry && (
        <button onClick={onRetry} className="btn btn-secondary btn-sm" style={{ borderColor: '#fca5a5' }}>
          <RefreshCw size={14} />
          Retry Request
        </button>
      )}
    </div>
  );
};
