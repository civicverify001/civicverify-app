import { Outlet } from 'react-router-dom'
import Sidebar from '../../components/Sidebar'

const orgNav = [
  { path: '', label: 'Dashboard', icon: '◫' },
  { path: '/request', label: 'Request Survey', icon: '+' },
  { path: '/surveys', label: 'My Surveys', icon: '☰' },
  { path: '/results', label: 'Results', icon: '↗' },
  { path: '/billing', label: 'Billing', icon: '$' },
  { path: '/profile', label: 'Profile', icon: '⚙' },
]

export default function OrgLayout() {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F5F1EC' }}>
      <Sidebar items={orgNav} basePath="/org" />
      <main style={{ flex: 1, marginLeft: 240, padding: '28px 32px' }}>
        <Outlet />
      </main>
    </div>
  )
}
