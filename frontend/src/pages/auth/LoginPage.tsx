/**
 * Socio-hub Role-Selection Login Page
 * Faithfully mirrors the reference UI ("Welcome Back - Choose your role to continue").
 * Supports direct role-based login (Admin, Volunteer, Public) and credentials.
 */
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types/shared';
import {
  ShieldCheck,
  UserCheck,
  Users,
  ArrowRight,
  Lock,
  Mail,
  AlertCircle,
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { loginAs, isLoading, currentUser } = useAuth();

  const [selectedRole, setSelectedRole] = useState<UserRole>('admin');
  const [email, setEmail] = useState('aarav.singh@sociohub.org');
  const [password, setPassword] = useState('••••••••••••');
  const [error, setError] = useState<string | null>(null);

  const from = (location.state as any)?.from?.pathname || '/admin/overview';

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    if (role === 'admin') setEmail('aarav.singh@sociohub.org');
    else if (role === 'volunteer') setEmail('rohan.sharma@sociohub.org');
    else setEmail('priya.patel@community.org');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await loginAs(selectedRole, email);
      if (selectedRole === 'admin') {
        navigate(from, { replace: true });
      } else if (selectedRole === 'volunteer') {
        navigate('/volunteer', { replace: true });
      } else {
        navigate('/report', { replace: true });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#fffbeb',
        backgroundImage: 'radial-gradient(#fde68a 1px, transparent 1px), radial-gradient(#fde68a 1px, #fffdf5 1px)',
        backgroundSize: '28px 28px',
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
          maxWidth: '480px',
          padding: '36px 32px',
          boxShadow: '0 20px 25px -5px rgba(0,0,0,0.08), 0 8px 10px -6px rgba(0,0,0,0.04)',
          borderRadius: '16px',
        }}
      >
        {/* Brand Logo Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '4px',
              padding: '6px',
              backgroundColor: '#0f172a',
              margin: '0 auto 12px auto',
            }}
          >
            <div style={{ backgroundColor: '#ef4444', borderRadius: '4px' }} />
            <div style={{ backgroundColor: '#f59e0b', borderRadius: '4px' }} />
            <div style={{ backgroundColor: '#0ea5e9', borderRadius: '4px' }} />
            <div style={{ backgroundColor: '#10b981', borderRadius: '4px' }} />
          </div>

          <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
            Welcome Back
          </h2>
          <p style={{ fontSize: '13.5px', color: '#64748b', marginTop: '4px' }}>
            Choose your role to continue into Socio-hub
          </p>
        </div>

        {error && (
          <div style={{ padding: '10px 14px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#b91c1c', fontSize: '13px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* 3 Role Selection Cards matching the reference image */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
          {/* Admin Role */}
          <div
            onClick={() => handleRoleSelect('admin')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 16px',
              borderRadius: '12px',
              border: selectedRole === 'admin' ? '2px solid #ef4444' : '1px solid #e2e8f0',
              backgroundColor: selectedRole === 'admin' ? '#fff5f5' : '#ffffff',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  backgroundColor: '#fee2e2',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#dc2626',
                  flexShrink: 0,
                }}
              >
                <ShieldCheck size={20} />
              </div>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>Admin</div>
                <div style={{ fontSize: '11.5px', color: '#64748b' }}>
                  Manage operations, verify reports, allocate resources
                </div>
              </div>
            </div>
            <ArrowRight size={16} color={selectedRole === 'admin' ? '#ef4444' : '#cbd5e1'} />
          </div>

          {/* Volunteer Role */}
          <div
            onClick={() => handleRoleSelect('volunteer')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 16px',
              borderRadius: '12px',
              border: selectedRole === 'volunteer' ? '2px solid #10b981' : '1px solid #e2e8f0',
              backgroundColor: selectedRole === 'volunteer' ? '#f0fdf4' : '#ffffff',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  backgroundColor: '#d1fae5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#059669',
                  flexShrink: 0,
                }}
              >
                <UserCheck size={20} />
              </div>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>Volunteer</div>
                <div style={{ fontSize: '11.5px', color: '#64748b' }}>
                  Take up tasks, make an impact, track your progress
                </div>
              </div>
            </div>
            <ArrowRight size={16} color={selectedRole === 'volunteer' ? '#10b981' : '#cbd5e1'} />
          </div>

          {/* Public / Community Role */}
          <div
            onClick={() => handleRoleSelect('community')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 16px',
              borderRadius: '12px',
              border: selectedRole === 'community' ? '2px solid #0284c7' : '1px solid #e2e8f0',
              backgroundColor: selectedRole === 'community' ? '#f0f9ff' : '#ffffff',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  backgroundColor: '#e0f2fe',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#0284c7',
                  flexShrink: 0,
                }}
              >
                <Users size={20} />
              </div>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>Public</div>
                <div style={{ fontSize: '11.5px', color: '#64748b' }}>
                  Report a need, check status, get involved
                </div>
              </div>
            </div>
            <ArrowRight size={16} color={selectedRole === 'community' ? '#0284c7' : '#cbd5e1'} />
          </div>
        </div>

        {/* Credentials Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '18px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                Account Email
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field"
                  style={{ paddingLeft: '32px' }}
                  required
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                Password / Passphrase
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field"
                  style={{ paddingLeft: '32px' }}
                  required
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="btn btn-primary"
            style={{ width: '100%', height: '42px', fontSize: '14px', borderRadius: '10px' }}
          >
            {isLoading ? 'Verifying Authorized Identity...' : `Sign In as ${selectedRole.toUpperCase()}`}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '18px', fontSize: '12px', color: '#64748b' }}>
          New here? <span onClick={() => navigate('/report')} style={{ color: '#0284c7', fontWeight: 600, cursor: 'pointer' }}>Submit a Community Report</span>
        </div>
      </div>
    </div>
  );
};
