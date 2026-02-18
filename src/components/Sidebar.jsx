import { NavLink } from 'react-router-dom'
import { Shield } from 'lucide-react'
import { COLORS } from '../utils/constants'
import { useAuth } from '../hooks/useAuth'

export default function Sidebar({ items, basePath }) {
  const { profile } = useAuth()

  return (
    <aside style={{
      width: 240, minHeight: '100vh', background: COLORS.navy,
      padding: '20px 0', display: 'flex', flexDirection: 'column',
      fontFamily: 'DM Sans, sans-serif', position: 'fixed', left: 0, top: 0,
      zIndex: 50
    }}>
      {/* Logo */}
      <NavLink to="/" style={{ 
        display: 'flex', alignItems: 'center', gap: 10, padding: '0 20px 24px',
        textDecoration: 'none', borderBottom: '1px solid rgba(255,255,255,0.08)'
      }}>
        <Shield size={24} color={COLORS.gold} />
        <span style={{ fontFamily: "'Libre Baskerville', serif", fontSize: 16, fontWeight: 700, color: '#fff' }}>
          Civic<span style={{ color: COLORS.gold }}>Verify</span>
        </span>
      </NavLink>

      {/* Nav Items */}
      <nav style={{ flex: 1, padding: '16px 12px' }}>
        {items.map(item => (
          <NavLink
            key={item.path}
            to={`${basePath}${item.path}`}
            end={item.path === ''}
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '10px 16px', borderRadius: 8, marginBottom: 4,
              textDecoration: 'none', fontSize: 14, fontWeight: isActive ? 600 : 400,
              color: isActive ? COLORS.gold : 'rgba(255,255,255,0.65)',
              background: isActive ? 'rgba(197,150,12,0.1)' : 'transparent',
              transition: 'all 0.15s ease',
              position: 'relative'
            })}
          >
            <span style={{ fontSize: 18, width: 22, textAlign: 'center' }}>{item.icon}</span>
            <span>{item.label}</span>
            {item.badge && (
              <span style={{
                marginLeft: 'auto', background: COLORS.red, color: '#fff',
                fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 10
              }}>
                {item.badge}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User card */}
      {profile && (
        <div style={{
          margin: '0 12px', padding: '14px 16px', borderRadius: 8,
          background: 'rgba(255,255,255,0.05)', borderTop: '1px solid rgba(255,255,255,0.08)'
        }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>
            {profile.full_name || 'User'}
          </div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>
            {profile.email}
          </div>
          <div style={{
            fontSize: 10, color: COLORS.gold, fontWeight: 600, marginTop: 6,
            textTransform: 'uppercase', letterSpacing: '0.05em'
          }}>
            {profile.role === 'admin' ? '● Admin' : profile.role === 'org' ? '● Organization' : 
             profile.is_verified ? '● Verified Citizen' : '○ Unverified'}
          </div>
        </div>
      )}
    </aside>
  )
}
