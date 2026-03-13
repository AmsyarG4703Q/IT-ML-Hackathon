import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  FiGrid, FiUser, FiMap, FiLogOut, FiSun, FiMoon, FiZap,
  FiCode, FiMessageSquare
} from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const NAV = [
  { to: '/dashboard',     icon: FiGrid,          label: 'Dashboard'    },
  { to: '/coding',        icon: FiCode,          label: 'Coding'       },
  { to: '/communication', icon: FiMessageSquare, label: 'Communication'},
  { to: '/roadmap',       icon: FiMap,           label: 'Roadmap'      },
  { to: '/profile',       icon: FiUser,          label: 'My Profile'   },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const initials = user?.name
    ? user.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : 'U';

  return (
    <aside className="sidebar">
      {/* Brand */}
      <div style={{ padding: '20px 18px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-4">
          <div style={{
            width: 34, height: 34, borderRadius: 8, background: '#2d6bef',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <FiZap color="#fff" size={16} />
          </div>
          <div>
            <div style={{ color: '#e8ecf5', fontWeight: 700, fontSize: 14, letterSpacing: '-0.2px' }}>PlacementAI</div>
            <div style={{ color: 'rgba(255,255,255,0.32)', fontSize: 11, marginTop: 1 }}>Career Dashboard</div>
          </div>
        </div>
      </div>

      {/* User info */}
      <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-4">
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'linear-gradient(135deg,#2d6bef,#7c3aed)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontWeight: 700, fontSize: 12, flexShrink: 0,
          }}>{initials}</div>
          <div style={{ minWidth: 0 }}>
            <div style={{ color: '#e8ecf5', fontWeight: 600, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.name || 'Student'}
            </div>
            <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.email || ''}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ padding: '10px 10px', flex: 1 }}>
        <div className="caption" style={{ color: 'rgba(255,255,255,0.25)', padding: '8px 10px 6px', letterSpacing: '0.08em' }}>
          NAVIGATION
        </div>
        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} style={({ isActive }) => ({
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '8px 12px', borderRadius: 7, marginBottom: 2,
            color: isActive ? '#fff' : 'rgba(255,255,255,0.45)',
            background: isActive ? 'rgba(45,107,239,0.20)' : 'transparent',
            fontSize: 13, fontWeight: isActive ? 600 : 400,
            textDecoration: 'none', transition: 'all 130ms ease',
            borderLeft: isActive ? '2px solid #2d6bef' : '2px solid transparent',
          })}>
            <Icon size={15} style={{ flexShrink: 0 }} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Bottom */}
      <div style={{ padding: '10px 10px 18px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <button onClick={toggleTheme} className="flex items-center gap-4"
          style={{ width: '100%', padding: '8px 12px', borderRadius: 7, color: 'rgba(255,255,255,0.4)', fontSize: 13, background: 'none', border: 'none', cursor: 'pointer', transition: 'color 130ms' }}
          onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.75)'}
          onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.4)'}>
          {isDark ? <FiSun size={14} /> : <FiMoon size={14} />}
          {isDark ? 'Light Mode' : 'Dark Mode'}
        </button>
        <button onClick={() => { logout(); navigate('/login'); }} className="flex items-center gap-4"
          style={{ width: '100%', padding: '8px 12px', borderRadius: 7, color: 'rgba(239,68,68,0.65)', fontSize: 13, background: 'none', border: 'none', cursor: 'pointer', marginTop: 2, transition: 'color 130ms' }}
          onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
          onMouseLeave={e => e.currentTarget.style.color = 'rgba(239,68,68,0.65)'}>
          <FiLogOut size={14} /> Sign Out
        </button>
      </div>
    </aside>
  );
}
