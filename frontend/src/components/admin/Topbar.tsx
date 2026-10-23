/**
 * Admin Topbar Navigation
 * Features global search, operational alerts, date range selector, org badge, and Create Task trigger.
 */
import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Menu,
  Search,
  Bell,
  Plus,
  Calendar,
  Building,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
} from 'lucide-react';

interface TopbarProps {
  onOpenSidebar: () => void;
  onOpenCreateTask: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({ onOpenSidebar, onOpenCreateTask }) => {
  const { currentUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d'>('30d');

  // Compute page title and breadcrumb from path
  const getPageTitle = () => {
    const path = location.pathname;
    if (path.includes('needs-reports')) return 'Needs & Reports — AI Intelligence Center';
    if (path.includes('tasks')) return 'Tasks & Volunteer Assignments';
    if (path.includes('departments')) return 'Departments & Groups';
    if (path.includes('volunteers')) return 'Volunteers Workforce Management';
    if (path.includes('resources')) return 'Resources & Inventory Command';
    if (path.includes('map')) return 'Geographic Community Needs Map';
    if (path.includes('analytics')) return 'Analytics & Social Impact Measurement';
    if (path.includes('audit')) return 'Activity & Audit Log';
    if (path.includes('settings')) return 'NGO Operational Settings & Rules';
    return 'Operations Command Overview';
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    // Route to needs-reports with query
    navigate(`/admin/needs-reports?q=${encodeURIComponent(searchQuery.trim())}`);
  };

  return (
    <header className="admin-topbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button
          onClick={onOpenSidebar}
          style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', display: 'flex' }}
          className="lg:hidden"
        >
          <Menu size={22} />
        </button>

        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', color: '#64748b' }}>
            <span>Admin</span>
            <span>/</span>
            <span style={{ color: '#0284c7', fontWeight: 600 }}>{getPageTitle().split('—')[0].trim()}</span>
          </div>
          <h1 style={{ fontSize: '17px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.01em' }}>
            {getPageTitle()}
          </h1>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        {/* Global Search Bar */}
        <form onSubmit={handleSearchSubmit} className="hidden md:block">
          <div style={{ position: 'relative', width: '280px' }}>
            <Search
              size={15}
              style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search cases, tasks, resources..."
              className="input-field"
              style={{ paddingLeft: '32px', height: '36px', fontSize: '13px' }}
            />
          </div>
        </form>

        {/* Date-Range Selector */}
        <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#f1f5f9', borderRadius: '6px', padding: '2px' }} className="hidden sm:flex">
          <button
            onClick={() => setDateRange('7d')}
            style={{
              padding: '4px 9px',
              fontSize: '11.5px',
              fontWeight: 600,
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              backgroundColor: dateRange === '7d' ? '#ffffff' : 'transparent',
              color: dateRange === '7d' ? '#0f172a' : '#64748b',
              boxShadow: dateRange === '7d' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
            }}
          >
            7D
          </button>
          <button
            onClick={() => setDateRange('30d')}
            style={{
              padding: '4px 9px',
              fontSize: '11.5px',
              fontWeight: 600,
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              backgroundColor: dateRange === '30d' ? '#ffffff' : 'transparent',
              color: dateRange === '30d' ? '#0f172a' : '#64748b',
              boxShadow: dateRange === '30d' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
            }}
          >
            30D
          </button>
          <button
            onClick={() => setDateRange('90d')}
            style={{
              padding: '4px 9px',
              fontSize: '11.5px',
              fontWeight: 600,
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              backgroundColor: dateRange === '90d' ? '#ffffff' : 'transparent',
              color: dateRange === '90d' ? '#0f172a' : '#64748b',
              boxShadow: dateRange === '90d' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
            }}
          >
            90D
          </button>
        </div>

        {/* Organization Indicator */}
        <div
          className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 rounded-md text-xs font-semibold text-slate-700"
          title="Current Authorized Organization"
        >
          <Building size={13} className="text-slate-500" />
          <span>Socio-hub Central</span>
        </div>

        {/* Notifications & Operational Alerts */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              backgroundColor: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              position: 'relative',
              color: '#475569',
            }}
          >
            <Bell size={17} />
            <span
              style={{
                position: 'absolute',
                top: '-2px',
                right: '-2px',
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: '#ef4444',
                border: '2px solid #ffffff',
              }}
            />
          </button>

          {showNotifications && (
            <div
              style={{
                position: 'absolute',
                right: 0,
                top: '44px',
                width: '340px',
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '10px',
                boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
                padding: '14px',
                zIndex: 50,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>Operational Alerts</span>
                <span className="badge badge-high" style={{ fontSize: '10.5px' }}>3 Actionable</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ padding: '8px', backgroundColor: '#fef2f2', borderRadius: '6px', fontSize: '12px' }}>
                  <div style={{ fontWeight: 600, color: '#b91c1c', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <AlertTriangle size={13} /> Stockout: Handpump Repair Kits
                  </div>
                  <div style={{ color: '#7f1d1d', marginTop: '2px' }}>0 available for active Case SR-00042</div>
                </div>

                <div style={{ padding: '8px', backgroundColor: '#fffbeb', borderRadius: '6px', fontSize: '12px' }}>
                  <div style={{ fontWeight: 600, color: '#b45309', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <AlertTriangle size={13} /> Overdue Task #107
                  </div>
                  <div style={{ color: '#78350f', marginTop: '2px' }}>Aliganj culvert clearance is 22h overdue</div>
                </div>

                <div style={{ padding: '8px', backgroundColor: '#ecfdf5', borderRadius: '6px', fontSize: '12px' }}>
                  <div style={{ fontWeight: 600, color: '#047857', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <CheckCircle2 size={13} /> Completion Evidence Ready
                  </div>
                  <div style={{ color: '#064e3b', marginTop: '2px' }}>Task #105 awaiting admin outcome verification</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Prominent Create Task Action */}
        <button
          onClick={onOpenCreateTask}
          className="btn btn-primary btn-sm"
          style={{ height: '36px', padding: '0 14px' }}
        >
          <Plus size={16} />
          <span>Create Task</span>
        </button>

        {/* Profile Avatar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingLeft: '6px' }}>
          <img
            src={currentUser?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80'}
            alt="Admin"
            style={{ width: '34px', height: '34px', borderRadius: '50%', objectFit: 'cover', border: '1px solid #e2e8f0' }}
          />
        </div>
      </div>
    </header>
  );
};
