/**
 * Admin Sidebar Navigation
 * Matches reference UI with dark navy background, clean active pill indicators, and live counters.
 */
import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  FileSpreadsheet,
  CheckSquare,
  Building2,
  Users,
  Package,
  MapPin,
  BarChart3,
  History,
  Settings,
  LogOut,
  X,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { currentUser, logout, authMode } = useAuth();

  const navItems = [
    { label: 'Overview', to: '/admin/overview', icon: LayoutDashboard },
    { label: 'Needs & Reports', to: '/admin/needs-reports', icon: FileSpreadsheet, badge: '5' },
    { label: 'Tasks & Assignments', to: '/admin/tasks', icon: CheckSquare, badge: '7' },
    { label: 'Departments & Groups', to: '/admin/departments', icon: Building2 },
    { label: 'Volunteers', to: '/admin/volunteers', icon: Users },
    { label: 'Resources & Inventory', to: '/admin/resources', icon: Package, alertBadge: '2' },
    { label: 'Needs Map', to: '/admin/map', icon: MapPin },
    { label: 'Analytics & Impact', to: '/admin/analytics', icon: BarChart3 },
    { label: 'Activity & Audit Log', to: '/admin/audit', icon: History },
    { label: 'Settings', to: '/admin/settings', icon: Settings },
  ];

  return (
    <aside className={`admin-sidebar ${isOpen ? 'open' : ''}`}>
      {/* Brand Header */}
      <div
        style={{
          padding: '20px 22px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Socio-hub colorful 4-dot petal logo */}
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '3px',
              padding: '4px',
              backgroundColor: '#1e293b',
            }}
          >
            <div style={{ backgroundColor: '#ef4444', borderRadius: '4px' }} />
            <div style={{ backgroundColor: '#f59e0b', borderRadius: '4px' }} />
            <div style={{ backgroundColor: '#0ea5e9', borderRadius: '4px' }} />
            <div style={{ backgroundColor: '#10b981', borderRadius: '4px' }} />
          </div>

          <div>
            <span style={{ fontSize: '18px', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em' }}>
              Socio-hub
            </span>
            <span
              style={{
                display: 'block',
                fontSize: '10.5px',
                fontWeight: 600,
                color: '#38bdf8',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Operations Command
            </span>
          </div>
        </div>

        {/* Mobile close button */}
        <button
          onClick={onClose}
          className="lg:hidden"
          style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
        >
          <X size={20} />
        </button>
      </div>

      {/* Navigation Links */}
      <nav style={{ flex: 1, padding: '16px 12px', overflowY: 'auto' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onClose}
                style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '9px 14px',
                  borderRadius: '8px',
                  fontSize: '13.5px',
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? '#ffffff' : '#94a3b8',
                  backgroundColor: isActive ? 'rgba(2, 132, 199, 0.22)' : 'transparent',
                  border: isActive ? '1px solid rgba(14, 165, 233, 0.35)' : '1px solid transparent',
                  textDecoration: 'none',
                  transition: 'all 0.15s ease',
                })}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '11px' }}>
                  <Icon size={18} />
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      backgroundColor: 'rgba(255, 255, 255, 0.12)',
                      color: '#ffffff',
                      padding: '1px 6px',
                      borderRadius: '999px',
                    }}
                  >
                    {item.badge}
                  </span>
                )}

                {item.alertBadge && (
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      backgroundColor: '#ef4444',
                      color: '#ffffff',
                      padding: '1px 6px',
                      borderRadius: '999px',
                    }}
                  >
                    {item.alertBadge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </div>
      </nav>

      {/* Bottom Profile and Logout */}
      <div
        style={{
          padding: '16px',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <img
              src={currentUser?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80'}
              alt={currentUser?.display_name || 'Admin'}
              style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }}
            />
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff' }}>
                {currentUser?.display_name || 'Aarav Singh'}
              </div>
              <div style={{ fontSize: '11px', color: '#38bdf8', fontWeight: 600 }}>
                Operations Administrator
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
          <span
            style={{
              fontSize: '10.5px',
              color: authMode === 'firebase' ? '#34d399' : '#f59e0b',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: authMode === 'firebase' ? '#34d399' : '#f59e0b' }} />
            {authMode === 'firebase' ? 'Firebase Auth' : 'Demo Session'}
          </span>

          <button
            onClick={() => logout()}
            style={{
              background: 'none',
              border: 'none',
              color: '#94a3b8',
              fontSize: '12px',
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              padding: '4px 6px',
              borderRadius: '4px',
            }}
            onMouseOver={(e) => ((e.currentTarget as HTMLElement).style.color = '#ef4444')}
            onMouseOut={(e) => ((e.currentTarget as HTMLElement).style.color = '#94a3b8')}
          >
            <LogOut size={13} />
            Sign Out
          </button>
        </div>
      </div>
    </aside>
  );
};
