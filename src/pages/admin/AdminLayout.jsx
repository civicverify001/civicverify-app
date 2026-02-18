import { Outlet } from 'react-router-dom'
import Sidebar from '../../components/Sidebar'

const adminNav = [
  { path: '', label: 'Dashboard', icon: '◫' },
  { path: '/surveys', label: 'Surveys', icon: '☰' },
  { path: '/review', label: 'Review Queue', icon: '✓', badge: '0' },
  { path: '/users', label: 'Users', icon: '☺' },
  { path: '/organizations', label: 'Organizations', icon: '⌂' },
  { path: '/analytics', label: 'Analytics', icon: '↗' },
  { path: '/export', label: 'Export', icon: '↓' },
  { path: '/settings', label: 'Settings', icon: '⚙' },
]

export default function AdminLayout() {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F5F1EC' }}>
      <Sidebar items={adminNav} basePath="/admin" />
      <main style={{ flex: 1, marginLeft: 240, padding: '28px 32px' }}>
        <Outlet />
      </main>
    </div>
  )
}
