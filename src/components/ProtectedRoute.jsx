// src/components/ProtectedRoute.jsx
import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function ProtectedRoute({ children, requiredRole }) {
  const { profile, loading } = useAuth()

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#F5F1EC' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 40, height: 40, border: '3px solid #E8E4DF', borderTopColor: '#0B2545', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
          <p style={{ color: '#666', fontFamily: 'DM Sans, sans-serif' }}>Loading...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        </div>
      </div>
    )
  }

  if (!profile) {
    return <Navigate to="/login" replace />
  }

  if (requiredRole && profile.role !== requiredRole) {
    const roleRoutes = { admin: '/admin', citizen: '/citizen', org: '/org' }
    return <Navigate to={roleRoutes[profile.role] || '/'} replace />
  }

  // Block org users who haven't been approved yet
  if (requiredRole === 'org' && profile.org_status !== 'approved') {
    return <Navigate to="/org-pending" replace />
  }

  return children
}
