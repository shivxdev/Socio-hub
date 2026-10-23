/**
 * StatCard Component
 * Displays key operational metrics with tinted icon pills, trends, and clickable routes.
 */
import React from 'react';
import { ArrowUpRight, LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  description: string;
  icon: LucideIcon;
  iconColor: string;
  iconBg: string;
  trend?: string;
  onClick?: () => void;
  badge?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  description,
  icon: Icon,
  iconColor,
  iconBg,
  trend,
  onClick,
  badge,
}) => {
  return (
    <div
      onClick={onClick}
      className={`socio-card relative transition-all duration-200 ${
        onClick ? 'cursor-pointer hover:-translate-y-0.5 hover:border-sky-300' : ''
      }`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        minHeight: '136px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div style={{ flex: 1 }}>
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>
            {title}
          </span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '4px' }}>
            <span style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
              {value}
            </span>
            {badge && (
              <span className="badge badge-high" style={{ fontSize: '11px', padding: '1px 6px' }}>
                {badge}
              </span>
            )}
          </div>
        </div>

        <div
          style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            backgroundColor: iconBg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Icon size={22} style={{ color: iconColor }} />
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: '12px',
          paddingTop: '10px',
          borderTop: '1px solid #f1f5f9',
          fontSize: '12.5px',
        }}
      >
        <span style={{ color: 'var(--text-muted)' }}>{description}</span>
        {trend && (
          <span style={{ fontWeight: 600, color: '#0284c7', display: 'flex', alignItems: 'center', gap: '2px' }}>
            {trend}
            <ArrowUpRight size={14} />
          </span>
        )}
      </div>
    </div>
  );
};
