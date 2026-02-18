import { Outlet } from 'react-router-dom'
import Sidebar from '../../components/Sidebar'

const citizenNav = [
  { path: '', label: 'Dashboard', icon: '◫' },
  { path: '/surveys', label: 'Surveys', icon: '☰' },
  { path: '/verify', label: 'Verify ID', icon: '✓' },
  { path: '/impact', label: 'My Impact', icon: '↗' },
  { path: '/account', label: 'Account', icon: '⚙' },
]

export default function CitizenLayout() {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F5F1EC' }}>
      <Sidebar items={citizenNav} basePath="/citizen" />
      <main style={{ flex: 1, marginLeft: 240, padding: '28px 32px' }}>
        <Outlet />
      </main>
    </div>
  )
}
