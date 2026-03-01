// src/pages/citizen/Account.jsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../supabaseClient'
import { useAuth } from '../../hooks/useAuth'

const C = {
  navy: '#0B2545', navyDeep: '#081c35',
  gold: '#C5960C', goldL: '#F0B429',
  warmWhite: '#FDFCFA', offWhite: '#f0f3f8',
  muted: '#6b7c93', ink: '#1a2942',
  red: '#dc2626', redLight: 'rgba(220,38,38,0.06)', redBorder: 'rgba(220,38,38,0.2)',
  green: '#16a34a', greenLight: 'rgba(22,163,74,0.06)',
  border: 'rgba(11,37,69,0.08)',
}
const font = "'Libre Baskerville', Georgia, serif"
const sans = "'DM Sans', system-ui, sans-serif"

const inputStyle = {
  width: '100%', padding: '11px 14px', fontSize: 14, fontFamily: sans,
  border: `1px solid ${C.border}`, borderRadius: 10, outline: 'none',
  color: C.ink, background: '#fff', boxSizing: 'border-box',
}

const labelStyle = {
  display: 'block', fontSize: 11, fontWeight: 700,
  textTransform: 'uppercase', letterSpacing: '1.5px',
  color: 'rgba(11,37,69,0.4)', marginBottom: 6,
}

export default function CitizenAccount() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [profile, setProfile] = useState(null)
  const [form, setForm] = useState({ full_name: '', email: '', phone: '', city: '', state: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [saveError, setSaveError] = useState('')

  // Password
  const [pwForm, setPwForm] = useState({ newPw: '', confirm: '' })
  const [pwSaving, setPwSaving] = useState(false)
  const [pwSuccess, setPwSuccess] = useState(false)
  const [pwError, setPwError] = useState('')

  // Delete account
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  useEffect(() => {
    if (!user) return
    loadProfile()
  }, [user])

  async function loadProfile() {
    setLoading(true)
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()
    if (data) {
      setProfile(data)
      setForm({
        full_name: data.full_name || '',
        email: user.email || '',
        phone: data.phone || '',
        city: data.city || '',
        state: data.state || '',
      })
    }
    setLoading(false)
  }

  async function handleSaveProfile(e) {
    e.preventDefault()
    setSaving(true)
    setSaveError('')
    setSaveSuccess(false)
    const { error } = await supabase
      .from('users')
      .update({ full_name: form.full_name, phone: form.phone, city: form.city, state: form.state })
      .eq('id', user.id)
    setSaving(false)
    if (error) { setSaveError('Failed to save. Please try again.'); return }
    setSaveSuccess(true)
    setTimeout(() => setSaveSuccess(false), 3000)
  }

  async function handleChangePassword(e) {
    e.preventDefault()
    setPwError('')
    setPwSuccess(false)
    if (pwForm.newPw.length < 8) { setPwError('Password must be at least 8 characters.'); return }
    if (pwForm.newPw !== pwForm.confirm) { setPwError('Passwords do not match.'); return }
    setPwSaving(true)
    const { error } = await supabase.auth.updateUser({ password: pwForm.newPw })
    setPwSaving(false)
    if (error) { setPwError(error.message); return }
    setPwSuccess(true)
    setPwForm({ newPw: '', confirm: '' })
    setTimeout(() => setPwSuccess(false), 3000)
  }

  async function handleDeleteAccount() {
    if (deleteConfirmText !== 'DELETE') {
      setDeleteError('Please type DELETE in capitals to confirm.')
      return
    }
    setDeleting(true)
    setDeleteError('')
    try {
      // 1. Delete all user data from tables
      await supabase.from('responses').delete().eq('user_id', user.id)
      await supabase.from('community_posts').delete().eq('user_id', user.id)
      await supabase.from('community_post_comments').delete().eq('user_id', user.id)
      await supabase.from('community_post_likes').delete().eq('user_id', user.id)
      await supabase.from('community_post_reactions').delete().eq('user_id', user.id)
      await supabase.from('notifications').delete().eq('user_id', user.id)
      await supabase.from('survey_chat_messages').delete().eq('user_id', user.id)
      // 2. Delete user profile row
      await supabase.from('users').delete().eq('id', user.id)
      // 3. Sign out — auth account deletion requires admin privileges,
      //    so we sign out and the orphaned auth row is cleaned up server-side
      await supabase.auth.signOut()
      navigate('/')
    } catch (err) {
      setDeleting(false)
      setDeleteError('Something went wrong. Please contact support@civicverify.org')
    }
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', fontFamily: sans, color: C.muted }}>
      Loading account…
    </div>
  )

  return (
    <div style={{ fontFamily: sans, background: C.warmWhite, minHeight: '100vh', padding: '32px 24px 80px' }}>
      <div style={{ maxWidth: 680, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: 36 }}>
          <h1 style={{ fontFamily: font, fontSize: 28, fontWeight: 700, color: C.navy, margin: '0 0 6px' }}>
            Account Settings
          </h1>
          <p style={{ fontSize: 14, color: C.muted, margin: 0 }}>
            Manage your profile, password, and account preferences.
          </p>
        </div>

        {/* ── PROFILE SECTION ── */}
        <div style={{ background: '#fff', borderRadius: 18, border: `1px solid ${C.border}`, padding: '28px 28px', marginBottom: 20 }}>
          <h2 style={{ fontFamily: font, fontSize: 18, fontWeight: 700, color: C.navy, margin: '0 0 22px', paddingBottom: 16, borderBottom: `1px solid ${C.border}` }}>
            Profile Information
          </h2>
          <form onSubmit={handleSaveProfile}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div>
                <label style={labelStyle}>Full Name</label>
                <input
                  value={form.full_name}
                  onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))}
                  style={inputStyle}
                  placeholder="Your full name"
                />
              </div>
              <div>
                <label style={labelStyle}>Email</label>
                <input
                  value={form.email}
                  disabled
                  style={{ ...inputStyle, background: C.offWhite, color: C.muted, cursor: 'not-allowed' }}
                />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div>
                <label style={labelStyle}>Phone (optional)</label>
                <input
                  value={form.phone}
                  onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                  style={inputStyle}
                  placeholder="(555) 000-0000"
                />
              </div>
              <div>
                <label style={labelStyle}>City</label>
                <input
                  value={form.city}
                  onChange={e => setForm(p => ({ ...p, city: e.target.value }))}
                  style={inputStyle}
                  placeholder="Indianapolis"
                />
              </div>
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>State</label>
              <input
                value={form.state}
                onChange={e => setForm(p => ({ ...p, state: e.target.value }))}
                style={{ ...inputStyle, maxWidth: 200 }}
                placeholder="IN"
                maxLength={2}
              />
            </div>

            {saveError && <p style={{ fontSize: 13, color: C.red, margin: '0 0 12px' }}>{saveError}</p>}
            {saveSuccess && <p style={{ fontSize: 13, color: C.green, margin: '0 0 12px' }}>✅ Profile saved successfully.</p>}

            <button type="submit" disabled={saving} style={{
              padding: '11px 28px', background: C.navy, color: '#fff',
              border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600,
              cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1, fontFamily: sans,
            }}>
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </form>
        </div>

        {/* ── PASSWORD SECTION ── */}
        <div style={{ background: '#fff', borderRadius: 18, border: `1px solid ${C.border}`, padding: '28px 28px', marginBottom: 20 }}>
          <h2 style={{ fontFamily: font, fontSize: 18, fontWeight: 700, color: C.navy, margin: '0 0 22px', paddingBottom: 16, borderBottom: `1px solid ${C.border}` }}>
            Change Password
          </h2>
          <form onSubmit={handleChangePassword}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
              <div>
                <label style={labelStyle}>New Password</label>
                <input
                  type="password"
                  value={pwForm.newPw}
                  onChange={e => setPwForm(p => ({ ...p, newPw: e.target.value }))}
                  style={inputStyle}
                  placeholder="Min. 8 characters"
                />
              </div>
              <div>
                <label style={labelStyle}>Confirm New Password</label>
                <input
                  type="password"
                  value={pwForm.confirm}
                  onChange={e => setPwForm(p => ({ ...p, confirm: e.target.value }))}
                  style={inputStyle}
                  placeholder="Repeat password"
                />
              </div>
            </div>
            {pwError && <p style={{ fontSize: 13, color: C.red, margin: '0 0 12px' }}>{pwError}</p>}
            {pwSuccess && <p style={{ fontSize: 13, color: C.green, margin: '0 0 12px' }}>✅ Password updated successfully.</p>}
            <button type="submit" disabled={pwSaving} style={{
              padding: '11px 28px', background: C.navy, color: '#fff',
              border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600,
              cursor: pwSaving ? 'not-allowed' : 'pointer', opacity: pwSaving ? 0.6 : 1, fontFamily: sans,
            }}>
              {pwSaving ? 'Updating…' : 'Update Password'}
            </button>
          </form>
        </div>

        {/* ── VERIFICATION STATUS ── */}
        <div style={{ background: '#fff', borderRadius: 18, border: `1px solid ${C.border}`, padding: '28px 28px', marginBottom: 20 }}>
          <h2 style={{ fontFamily: font, fontSize: 18, fontWeight: 700, color: C.navy, margin: '0 0 16px', paddingBottom: 16, borderBottom: `1px solid ${C.border}` }}>
            Identity Verification
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12, fontSize: 20,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: profile?.identity_verified ? C.greenLight : 'rgba(220,38,38,0.06)',
            }}>
              {profile?.identity_verified ? '✅' : '⚠️'}
            </div>
            <div>
              <p style={{ fontSize: 15, fontWeight: 700, color: C.navy, margin: '0 0 3px' }}>
                {profile?.identity_verified ? 'Identity Verified' : 'Not Yet Verified'}
              </p>
              <p style={{ fontSize: 13, color: C.muted, margin: 0 }}>
                {profile?.identity_verified
                  ? 'Your identity has been confirmed. Your ID document has been permanently deleted.'
                  : 'Verify your identity to participate in civic polls and surveys.'}
              </p>
            </div>
            {!profile?.identity_verified && (
              <button
                onClick={() => navigate('/citizen/verify')}
                style={{ marginLeft: 'auto', padding: '9px 20px', background: C.gold, color: '#fff', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}>
                Verify Now →
              </button>
            )}
          </div>
        </div>

        {/* ── DANGER ZONE ── */}
        <div style={{ background: '#fff', borderRadius: 18, border: `1px solid ${C.redBorder}`, padding: '28px 28px' }}>
          <h2 style={{ fontFamily: font, fontSize: 18, fontWeight: 700, color: C.red, margin: '0 0 10px', paddingBottom: 16, borderBottom: `1px solid ${C.redBorder}` }}>
            Danger Zone
          </h2>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20 }}>
            <div>
              <p style={{ fontSize: 15, fontWeight: 700, color: C.navy, margin: '0 0 4px' }}>Delete My Account</p>
              <p style={{ fontSize: 13, color: C.muted, margin: 0, lineHeight: 1.6, maxWidth: 400 }}>
                Permanently deletes your account, all your survey responses, community posts, and personal data. This cannot be undone.
              </p>
            </div>
            <button
              onClick={() => setShowDeleteModal(true)}
              style={{
                padding: '10px 22px', background: 'transparent', border: `1px solid ${C.red}`,
                borderRadius: 10, fontSize: 13, fontWeight: 600, color: C.red,
                cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0, fontFamily: sans,
              }}>
              Delete Account
            </button>
          </div>
        </div>

      </div>

      {/* ── DELETE CONFIRMATION MODAL ── */}
      {showDeleteModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 999,
          background: 'rgba(8,28,53,0.75)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
        }}>
          <div style={{
            background: '#fff', borderRadius: 20, padding: '36px 32px',
            maxWidth: 460, width: '100%', boxShadow: '0 24px 64px rgba(0,0,0,.25)',
          }}>
            <div style={{ fontSize: 36, marginBottom: 16, textAlign: 'center' }}>⚠️</div>
            <h2 style={{ fontFamily: font, fontSize: 22, fontWeight: 700, color: C.navy, margin: '0 0 12px', textAlign: 'center' }}>
              Delete Your Account?
            </h2>
            <p style={{ fontSize: 14, color: C.muted, lineHeight: 1.7, margin: '0 0 8px', textAlign: 'center' }}>
              This will permanently delete:
            </p>
            <div style={{ background: C.redLight, borderRadius: 12, padding: '14px 18px', marginBottom: 20 }}>
              {['Your profile and personal information', 'All your survey responses', 'All your community posts and comments', 'Your identity verification status'].map(item => (
                <div key={item} style={{ display: 'flex', gap: 10, marginBottom: 6, alignItems: 'center' }}>
                  <span style={{ color: C.red, fontSize: 12 }}>✕</span>
                  <span style={{ fontSize: 13, color: '#7f1d1d' }}>{item}</span>
                </div>
              ))}
            </div>
            <p style={{ fontSize: 13, fontWeight: 600, color: C.navy, margin: '0 0 8px' }}>
              Type <strong>DELETE</strong> to confirm:
            </p>
            <input
              value={deleteConfirmText}
              onChange={e => { setDeleteConfirmText(e.target.value); setDeleteError('') }}
              placeholder="Type DELETE here"
              style={{ ...inputStyle, marginBottom: 12, borderColor: deleteConfirmText === 'DELETE' ? C.red : C.border }}
            />
            {deleteError && <p style={{ fontSize: 13, color: C.red, margin: '0 0 12px' }}>{deleteError}</p>}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <button
                onClick={() => { setShowDeleteModal(false); setDeleteConfirmText(''); setDeleteError('') }}
                style={{
                  padding: '12px', background: C.offWhite, border: `1px solid ${C.border}`,
                  borderRadius: 10, fontSize: 14, fontWeight: 600, color: C.navy,
                  cursor: 'pointer', fontFamily: sans,
                }}>
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleting || deleteConfirmText !== 'DELETE'}
                style={{
                  padding: '12px', background: deleteConfirmText === 'DELETE' ? C.red : '#fca5a5',
                  border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, color: '#fff',
                  cursor: deleteConfirmText === 'DELETE' ? 'pointer' : 'not-allowed', fontFamily: sans,
                  transition: 'background .2s',
                }}>
                {deleting ? 'Deleting…' : 'Delete Forever'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
