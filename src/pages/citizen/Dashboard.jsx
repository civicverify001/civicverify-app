import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../supabaseClient'
import { COLORS, getTrustLevel } from '../../utils/constants'
import { Shield, CheckCircle, AlertCircle, BarChart3 } from 'lucide-react'

export default function CitizenDashboard() {
  const { profile } = useAuth()
  const [stats, setStats] = useState({ surveysCompleted: 0, activeSurveys: 0 })

  useEffect(() => {
    if (profile) loadStats()
  }, [profile])

  async function loadStats() {
    const { count: completed } = await supabase
      .from('responses').select('*', { count: 'exact', head: true })
      .eq('user_id', profile.id)
    
    const { count: active } = await supabase
      .from('surveys').select('*', { count: 'exact', head: true })
      .eq('status', 'active')

    setStats({ surveysCompleted: completed || 0, activeSurveys: active || 0 })
  }

  const trust = getTrustLevel(profile?.trust_score || 0)

  return (
    <div>
      <h1 style={{ fontFamily: "'Libre Baskerville', serif", fontSize: 26, color: COLORS.navy, marginBottom: 6 }}>
        Welcome back, {profile?.full_name?.split(' ')[0] || 'Citizen'}
      </h1>
      <p style={{ color: COLORS.gray, fontSize: 14, marginBottom: 28 }}>
        Your civic voice matters. Here's your overview.
      </p>

      {/* Verification Banner */}
      {!profile?.is_verified && (
        <Link to="/citizen/verify" style={{ textDecoration: 'none' }}>
          <div style={{
            background: 'linear-gradient(135deg, #FEF3C7, #FDE68A)', border: '1px solid #F59E0B',
            borderRadius: 12, padding: '18px 24px', marginBottom: 24,
            display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer'
          }}>
            <AlertCircle size={24} color="#D97706" />
            <div>
              <div style={{ fontWeight: 600, color: '#92400E', fontSize: 15 }}>Verify your identity to take surveys</div>
              <div style={{ color: '#A16207', fontSize: 13, marginTop: 2 }}>
                Quick ID verification required — takes less than 2 minutes
              </div>
            </div>
            <span style={{ marginLeft: 'auto', fontWeight: 600, color: '#D97706', fontSize: 13 }}>Verify Now →</span>
          </div>
        </Link>
      )}

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 28 }}>
        {[
          { label: 'Surveys Completed', value: stats.surveysCompleted, icon: <BarChart3 size={20} />, color: COLORS.navy },
          { label: 'Trust Score', value: profile?.trust_score || 0, icon: <Shield size={20} />, color: COLORS.gold, sub: trust.name },
          { label: 'Verification', value: profile?.is_verified ? 'Verified' : 'Pending', icon: <CheckCircle size={20} />, color: profile?.is_verified ? COLORS.green : COLORS.red },
          { label: 'Available Surveys', value: stats.activeSurveys, icon: <BarChart3 size={20} />, color: COLORS.green },
        ].map((s, i) => (
          <div key={i} style={{
            background: '#fff', borderRadius: 12, padding: '20px 22px',
            borderLeft: `4px solid ${s.color}`, boxShadow: '0 1px 4px rgba(0,0,0,0.04)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, color: s.color }}>
              {s.icon}
              <span style={{ fontSize: 12, fontWeight: 600, color: COLORS.gray, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {s.label}
              </span>
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, color: COLORS.navy }}>{s.value}</div>
            {s.sub && <div style={{ fontSize: 12, color: s.color, fontWeight: 600, marginTop: 2 }}>{s.sub}</div>}
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Link to="/citizen/surveys" style={{
          background: COLORS.navy, borderRadius: 12, padding: '24px',
          color: '#fff', textDecoration: 'none', display: 'block'
        }}>
          <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>Take a Survey</div>
          <div style={{ fontSize: 13, opacity: 0.7 }}>
            {stats.activeSurveys} surveys waiting for your voice
          </div>
        </Link>
        <Link to="/citizen/impact" style={{
          background: '#fff', borderRadius: 12, padding: '24px', border: `1px solid ${COLORS.grayLight}`,
          color: COLORS.navy, textDecoration: 'none', display: 'block'
        }}>
          <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>View Your Impact</div>
          <div style={{ fontSize: 13, color: COLORS.gray }}>
            See how your responses make a difference
          </div>
        </Link>
      </div>
    </div>
  )
}
