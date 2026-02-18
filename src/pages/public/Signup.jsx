import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { COLORS } from '../../utils/constants'
import { Shield, User, Building2 } from 'lucide-react'

export default function Signup() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('citizen')
  const [orgName, setOrgName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const { signUp } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (password.length < 6) { setError('Password must be at least 6 characters'); return }
    setLoading(true)
    try {
      const data = await signUp(email, password, fullName, role)
      setSuccess(true)
    } catch (err) {
      setError(err.message || 'Something went wrong')
    }
    setLoading(false)
  }

  const inputStyle = {
    width: '100%', padding: '12px 16px', borderRadius: 8,
    border: `1px solid ${COLORS.grayLight}`, fontSize: 15,
    fontFamily: 'DM Sans, sans-serif', outline: 'none', boxSizing: 'border-box'
  }

  if (success) {
    return (
      <div style={{
        minHeight: '100vh', background: COLORS.cream, display: 'flex',
        alignItems: 'center', justifyContent: 'center', fontFamily: 'DM Sans, sans-serif', padding: 20
      }}>
        <div style={{
          width: '100%', maxWidth: 420, background: '#fff', borderRadius: 16,
          padding: '48px 40px', textAlign: 'center', boxShadow: '0 4px 24px rgba(11,37,69,0.08)'
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>✓</div>
          <h2 style={{ color: COLORS.navy, marginBottom: 8 }}>Account Created!</h2>
          <p style={{ color: COLORS.gray, fontSize: 14, marginBottom: 24 }}>
            Check your email to confirm your account, then sign in to get started.
          </p>
          <Link to="/login" style={{
            display: 'inline-block', padding: '12px 32px', borderRadius: 8,
            background: COLORS.navy, color: '#fff', fontSize: 15, fontWeight: 600,
            textDecoration: 'none'
          }}>
            Go to Sign In
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh', background: COLORS.cream, display: 'flex',
      alignItems: 'center', justifyContent: 'center', fontFamily: 'DM Sans, sans-serif', padding: 20
    }}>
      <div style={{
        width: '100%', maxWidth: 440, background: '#fff', borderRadius: 16,
        padding: '44px 40px', boxShadow: '0 4px 24px rgba(11,37,69,0.08)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <Link to="/" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 10 }}>
            <Shield size={28} color={COLORS.gold} />
            <span style={{ fontFamily: "'Libre Baskerville', serif", fontSize: 20, fontWeight: 700, color: COLORS.navy }}>
              Civic<span style={{ color: COLORS.gold }}>Verify</span>
            </span>
          </Link>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: COLORS.navy, marginTop: 20, marginBottom: 6 }}>
            Create your account
          </h1>
          <p style={{ color: COLORS.gray, fontSize: 14, margin: 0 }}>
            Join the verified civic voice platform
          </p>
        </div>

        {/* Role Selection */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
          {[
            { value: 'citizen', label: 'Citizen', desc: 'Take surveys, make your voice heard', icon: <User size={20} /> },
            { value: 'org', label: 'Organization', desc: 'Commission verified civic data', icon: <Building2 size={20} /> },
          ].map(opt => (
            <button key={opt.value} type="button" onClick={() => setRole(opt.value)} style={{
              padding: '16px 14px', borderRadius: 10, cursor: 'pointer',
              border: role === opt.value ? `2px solid ${COLORS.navy}` : `1px solid ${COLORS.grayLight}`,
              background: role === opt.value ? 'rgba(11,37,69,0.04)' : '#fff',
              textAlign: 'center', transition: 'all 0.15s'
            }}>
              <div style={{ color: role === opt.value ? COLORS.navy : COLORS.gray, marginBottom: 6 }}>{opt.icon}</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.navy }}>{opt.label}</div>
              <div style={{ fontSize: 11, color: COLORS.gray, marginTop: 2 }}>{opt.desc}</div>
            </button>
          ))}
        </div>

        {error && (
          <div style={{
            background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8,
            padding: '10px 14px', marginBottom: 16, color: COLORS.red, fontSize: 13
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: COLORS.grayDark, marginBottom: 6 }}>
              Full Name
            </label>
            <input type="text" value={fullName} onChange={e => setFullName(e.target.value)}
              placeholder="Your full name" required style={inputStyle} />
          </div>

          {role === 'org' && (
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: COLORS.grayDark, marginBottom: 6 }}>
                Organization Name
              </label>
              <input type="text" value={orgName} onChange={e => setOrgName(e.target.value)}
                placeholder="Your organization" required style={inputStyle} />
            </div>
          )}

          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: COLORS.grayDark, marginBottom: 6 }}>
              Email
            </label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com" required style={inputStyle} />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: COLORS.grayDark, marginBottom: 6 }}>
              Password
            </label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="At least 6 characters" required style={inputStyle} />
          </div>

          <button type="submit" disabled={loading} style={{
            width: '100%', padding: '13px', borderRadius: 8, border: 'none',
            background: COLORS.navy, color: '#fff', fontSize: 15, fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
            fontFamily: 'DM Sans, sans-serif'
          }}>
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: COLORS.gray }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: COLORS.navy, fontWeight: 600, textDecoration: 'none' }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
