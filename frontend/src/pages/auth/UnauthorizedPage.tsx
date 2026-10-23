/**
 * Unauthorized / Access Denied Page (403)
 * Displayed when an authenticated user lacks the required admin role to enter the operations workspace.
 */
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ShieldAlert, ArrowLeft, LogOut, CheckCircle2 } from 'lucide-react';

export const UnauthorizedPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, logout, loginAs } = useAuth();

  const attemptedRole = (location.state as any)?.attemptedRole || currentUser?.role;

  const handleSwitchToAdmin = async () => {
    await loginAs('admin');
    navigate('/admin/overview', { replace: true });
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#f8fafc',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
    >
      <div
        className="socio-card"
        style={{
          width: '100%',
          maxWidth: '520px',
          padding: '36px',
          textAlign: 'center',
          borderRadius: '16px',
        }}
      >
        <div
          style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            backgroundColor: '#fee2e2',
            color: '#dc2626',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px auto',
          }}
        >
          <ShieldAlert size={32} />
        </div>

        <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>
          Administrative Authorization Required
        </h2>

        <p style={{ fontSize: '13.5px', color: '#64748b', lineHeight: 1.5, marginBottom: '20px' }}>
          You are currently signed in as <strong>{currentUser?.display_name || 'User'}</strong> with role{' '}
          <span className="badge badge-medium" style={{ textTransform: 'uppercase', fontSize: '11px' }}>
            {attemptedRole || 'volunteer'}
          </span>
          . The Operations Command Center is restricted strictly to authorized NGO administrators.
        </p>

        <div style={{ padding: '14px', backgroundColor: '#f1f5f9', borderRadius: '8px', fontSize: '12.5px', color: '#475569', marginBottom: '24px', textAlign: 'left' }}>
          <strong>Enforced Security Policy:</strong>
          <ul style={{ paddingLeft: '18px', marginTop: '6px', fontSize: '12px' }}>
            <li>Backend token validation rejects non-admin identities.</li>
            <li>Client-side route spoofing or localStorage alterations are blocked.</li>
            <li>Volunteers must use their designated portal at <code>/volunteer</code>.</li>
          </ul>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button
            onClick={handleSwitchToAdmin}
            className="btn btn-primary"
            style={{ width: '100%', height: '40px' }}
          >
            Switch to Admin Profile (Aarav Singh)
          </button>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => navigate('/volunteer')}
              className="btn btn-secondary"
              style={{ flex: 1 }}
            >
              Go to Volunteer Workspace
            </button>
            <button
              onClick={async () => {
                await logout();
                navigate('/login');
              }}
              className="btn btn-secondary"
              style={{ flex: 1, color: '#ef4444' }}
            >
              <LogOut size={14} /> Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
