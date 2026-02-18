import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Shield } from 'lucide-react'
import { COLORS } from '../utils/constants'

export default function Navbar() {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  const dashboardRoute = profile ? 
    { admin: '/admin', citizen: '/citizen', org: '/org' }[profile.role] || '/' : '/'

  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 100,
      background: COLORS.navy, borderBottom: '1px solid rgba(255,255,255,0.06)'
    }}>
      <div style={{
        maxWidth: 1200, margin: '0 auto', padding: '0 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: 60, position: 'relative'
      }}>
        {/* Logo - Centered */}
        <Link to="/" style={{ 
          display: 'flex', alignItems: 'center', gap: 10,
          textDecoration: 'none', position: 'absolute', left: '50%', transform: 'translateX(-50%)'
        }}>
          <Shield size={26} color={COLORS.gold} />
          <span style={{ 
            fontFamily: "'Libre Baskerville', serif", fontSize: 18, fontWeight: 700, color: '#fff' 
          }}>
            Civic<span style={{ color: COLORS.gold }}>Verify</span>
          </span>
        </Link>

        {/* Right side buttons */}
        <div style={{ 
          display: 'flex', gap: 10, marginLeft: 'auto', alignItems: 'center' 
        }}>
          {profile ? (
            <>
              <Link to={dashboardRoute} style={{
                background: 'transparent', border: '1px solid rgba(255,255,255,0.2)',
                color: '#fff', borderRadius: 8, padding: '8px 18px',
                fontSize: 13, fontWeight: 600, cursor: 'pointer', textDecoration: 'none',
                fontFamily: 'DM Sans, sans-serif'
              }}>
                Dashboard
              </Link>
              <button onClick={handleSignOut} style={{
                background: 'rgba(255,255,255,0.1)', border: 'none',
                color: '#fff', borderRadius: 8, padding: '8px 18px',
                fontSize: 13, fontWeight: 600, cursor: 'pointer',
                fontFamily: 'DM Sans, sans-serif'
              }}>
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" style={{
                background: 'transparent', border: '1px solid rgba(255,255,255,0.2)',
                color: '#fff', borderRadius: 8, padding: '8px 18px',
                fontSize: 13, fontWeight: 600, cursor: 'pointer', textDecoration: 'none',
                fontFamily: 'DM Sans, sans-serif'
              }}>
                Sign In
              </Link>
              <Link to="/signup" style={{
                background: COLORS.red, border: 'none',
                color: '#fff', borderRadius: 8, padding: '8px 18px',
                fontSize: 13, fontWeight: 600, cursor: 'pointer', textDecoration: 'none',
                fontFamily: 'DM Sans, sans-serif'
              }}>
                Get Verified
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
