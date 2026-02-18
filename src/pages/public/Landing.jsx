import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from '../../supabaseClient'
import { COLORS } from '../../utils/constants'
import Navbar from '../../components/Navbar'
import { Shield, CheckCircle, Users, BarChart3, Lock, MessageSquare, ArrowRight } from 'lucide-react'

export default function Landing() {
  const [stats, setStats] = useState({ users: 0, surveys: 0, responses: 0 })

  useEffect(() => {
    loadStats()
    // Realtime subscriptions for live counts
    const channel = supabase.channel('public-stats')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'users' }, () => loadStats())
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'responses' }, () => loadStats())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  async function loadStats() {
    const [u, s, r] = await Promise.all([
      supabase.from('users').select('*', { count: 'exact', head: true }),
      supabase.from('surveys').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('responses').select('*', { count: 'exact', head: true }),
    ])
    setStats({ users: u.count || 0, surveys: s.count || 0, responses: r.count || 0 })
  }

  const section = { maxWidth: 1100, margin: '0 auto', padding: '80px 24px' }
  const serif = "'Libre Baskerville', serif"
  const sans = "'DM Sans', sans-serif"

  return (
    <div style={{ fontFamily: sans, color: COLORS.grayDark }}>
      <Navbar />

      {/* HERO */}
      <section style={{ background: `linear-gradient(135deg, ${COLORS.navy} 0%, #162D50 100%)`, padding: '100px 24px 80px', textAlign: 'center' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.gold, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 20 }}>
            THE FUTURE OF CIVIC DATA
          </div>
          <h1 style={{ fontFamily: serif, fontSize: 'clamp(32px, 5vw, 56px)', fontWeight: 700, color: '#fff', lineHeight: 1.15, marginBottom: 20 }}>
            Your Voice.<br />
            <span style={{ color: COLORS.gold }}>Verified.</span> Heard.
          </h1>
          <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.7)', maxWidth: 600, margin: '0 auto 36px', lineHeight: 1.6 }}>
            CivicVerify ensures authentic public opinion reaches policymakers — 
            every response backed by a verified citizen, not bots or duplicates.
          </p>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/signup" style={{
              background: COLORS.gold, color: COLORS.navy, padding: '14px 32px',
              borderRadius: 8, fontSize: 15, fontWeight: 700, textDecoration: 'none',
              display: 'inline-flex', alignItems: 'center', gap: 8
            }}>
              I'm a Citizen <ArrowRight size={16} />
            </Link>
            <Link to="/contact" style={{
              background: 'rgba(255,255,255,0.1)', color: '#fff', padding: '14px 32px',
              borderRadius: 8, fontSize: 15, fontWeight: 700, textDecoration: 'none',
              border: '1px solid rgba(255,255,255,0.2)'
            }}>
              I'm an Organization
            </Link>
          </div>
        </div>
      </section>

      {/* LIVE STATS BAR */}
      <section style={{ background: '#fff', borderBottom: `1px solid ${COLORS.grayLight}` }}>
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '28px 24px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, textAlign: 'center' }}>
          {[
            { label: 'Verified Citizens', value: stats.users, icon: <Users size={20} /> },
            { label: 'Active Surveys', value: stats.surveys, icon: <BarChart3 size={20} /> },
            { label: 'Responses Collected', value: stats.responses, icon: <CheckCircle size={20} /> },
          ].map((s, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
              <div style={{ color: COLORS.gold }}>{s.icon}</div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: COLORS.green, display: 'inline-block' }} />
                  <span style={{ fontSize: 28, fontWeight: 700, color: COLORS.navy }}>{s.value.toLocaleString()}</span>
                </div>
                <div style={{ fontSize: 12, color: COLORS.gray, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section style={{ ...section }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.gold, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>
            THE CIVICVERIFY PROCESS
          </div>
          <h2 style={{ fontFamily: serif, fontSize: 34, color: COLORS.navy }}>How It Works</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 28 }}>
          {[
            { step: '01', title: 'Sign Up', desc: 'Create your free account in under a minute.' },
            { step: '02', title: 'Verify ID', desc: 'Quick, secure identity check. Your ID is verified then deleted.' },
            { step: '03', title: 'Take Surveys', desc: 'Respond to civic polls that match your profile.' },
            { step: '04', title: 'Make Impact', desc: 'Your verified voice reaches policymakers and researchers.' },
          ].map((s, i) => (
            <div key={i} style={{ background: '#fff', borderRadius: 14, padding: '32px 26px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
              <div style={{ fontFamily: serif, fontSize: 32, color: COLORS.gold, marginBottom: 12 }}>{s.step}</div>
              <div style={{ fontSize: 17, fontWeight: 700, color: COLORS.navy, marginBottom: 8 }}>{s.title}</div>
              <div style={{ fontSize: 14, color: COLORS.gray, lineHeight: 1.5 }}>{s.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FOR CITIZENS */}
      <section style={{ background: COLORS.navy }}>
        <div style={{ ...section, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.gold, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>
              FOR CITIZENS
            </div>
            <h2 style={{ fontFamily: serif, fontSize: 32, color: '#fff', marginBottom: 16 }}>
              Your voice deserves to be heard — and trusted
            </h2>
            <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.65)', lineHeight: 1.7, marginBottom: 24 }}>
              Traditional polls are broken. They can be gamed by bots, manipulated by special interests, 
              and they rarely verify who's actually responding. CivicVerify changes that.
            </p>
            {[
              'One verified identity, one authentic voice',
              'Your responses are 100% anonymous after verification',
              'See the real impact of your civic participation',
              'Earn trust badges as you contribute more',
            ].map((t, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <CheckCircle size={16} color={COLORS.gold} />
                <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14 }}>{t}</span>
              </div>
            ))}
            <Link to="/signup" style={{
              display: 'inline-block', marginTop: 24, background: COLORS.gold, color: COLORS.navy,
              padding: '12px 28px', borderRadius: 8, fontWeight: 700, fontSize: 14, textDecoration: 'none'
            }}>
              Get Verified Free →
            </Link>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: 40, textAlign: 'center', border: '1px solid rgba(255,255,255,0.08)' }}>
            <Shield size={64} color={COLORS.gold} strokeWidth={1.5} />
            <div style={{ fontFamily: serif, fontSize: 22, color: '#fff', marginTop: 20 }}>Privacy First</div>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', marginTop: 8 }}>
              Your ID is verified then immediately deleted. Only your demographic category is retained — never your name or personal details.
            </p>
          </div>
        </div>
      </section>

      {/* FOR ORGANIZATIONS */}
      <section style={{ ...section }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.gold, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>
            FOR ORGANIZATIONS
          </div>
          <h2 style={{ fontFamily: serif, fontSize: 34, color: COLORS.navy, marginBottom: 12 }}>
            Commission Verified Civic Data
          </h2>
          <p style={{ fontSize: 16, color: COLORS.gray, maxWidth: 600, margin: '0 auto' }}>
            Stop relying on unverified online polls. Get real opinions from real, identity-verified citizens.
          </p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
          {[
            { title: 'Standard', desc: '5-question surveys with verified responses from our citizen pool.', features: ['5 questions per survey', 'Verified respondents only', 'Aggregated results dashboard', 'CSV export'] },
            { title: 'Refined', desc: '10-question surveys with demographic targeting and filtering.', features: ['10 questions per survey', 'Demographic targeting', 'Filtered results by group', 'Priority support'] },
            { title: 'Precision', desc: 'Custom research with advanced targeting and dedicated support.', features: ['Custom question count', 'Advanced targeting', 'Real-time monitoring', 'Dedicated account manager'] },
          ].map((t, i) => (
            <div key={i} style={{
              background: '#fff', borderRadius: 14, padding: '32px 26px',
              border: i === 1 ? `2px solid ${COLORS.navy}` : `1px solid ${COLORS.grayLight}`,
              position: 'relative'
            }}>
              {i === 1 && <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: COLORS.navy, color: '#fff', fontSize: 11, fontWeight: 700, padding: '4px 14px', borderRadius: 20 }}>POPULAR</div>}
              <div style={{ fontSize: 20, fontWeight: 700, color: COLORS.navy, marginBottom: 8 }}>{t.title}</div>
              <div style={{ fontSize: 13, color: COLORS.gray, marginBottom: 20, lineHeight: 1.5 }}>{t.desc}</div>
              {t.features.map((f, j) => (
                <div key={j} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <CheckCircle size={14} color={COLORS.green} />
                  <span style={{ fontSize: 13, color: COLORS.grayDark }}>{f}</span>
                </div>
              ))}
              <Link to="/contact" style={{
                display: 'block', textAlign: 'center', marginTop: 20,
                padding: '11px 20px', borderRadius: 8, fontWeight: 600, fontSize: 14,
                textDecoration: 'none',
                background: i === 1 ? COLORS.navy : 'transparent',
                color: i === 1 ? '#fff' : COLORS.navy,
                border: i === 1 ? 'none' : `1px solid ${COLORS.navy}`
              }}>
                Request a Demo
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* TRUST SECTION */}
      <section style={{ background: '#fff', borderTop: `1px solid ${COLORS.grayLight}` }}>
        <div style={{ ...section, textAlign: 'center' }}>
          <h2 style={{ fontFamily: serif, fontSize: 32, color: COLORS.navy, marginBottom: 40 }}>
            Built on Trust & Transparency
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 32 }}>
            {[
              { icon: <Shield size={28} />, title: 'Identity Verified', desc: 'Every respondent is a real, verified citizen. No bots. No duplicates.' },
              { icon: <Lock size={28} />, title: 'Privacy Protected', desc: 'IDs are verified then deleted. Only anonymous demographic data is retained.' },
              { icon: <MessageSquare size={28} />, title: 'Nonpartisan', desc: 'We serve data, not agendas. CivicVerify is committed to political neutrality.' },
            ].map((t, i) => (
              <div key={i}>
                <div style={{ color: COLORS.gold, marginBottom: 14 }}>{t.icon}</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: COLORS.navy, marginBottom: 8 }}>{t.title}</div>
                <div style={{ fontSize: 14, color: COLORS.gray, lineHeight: 1.6 }}>{t.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: COLORS.navy, padding: '80px 24px', textAlign: 'center' }}>
        <h2 style={{ fontFamily: serif, fontSize: 32, color: '#fff', marginBottom: 16 }}>
          Ready to make your voice count?
        </h2>
        <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.6)', marginBottom: 32 }}>
          Join thousands of verified citizens shaping public policy.
        </p>
        <Link to="/signup" style={{
          display: 'inline-block', background: COLORS.gold, color: COLORS.navy,
          padding: '14px 36px', borderRadius: 8, fontWeight: 700, fontSize: 16, textDecoration: 'none'
        }}>
          Get Started Free
        </Link>
      </section>

      {/* FOOTER */}
      <footer style={{ background: '#071A30', padding: '40px 24px', textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 16 }}>
          <Shield size={18} color={COLORS.gold} />
          <span style={{ fontFamily: serif, fontSize: 14, color: '#fff' }}>Civic<span style={{ color: COLORS.gold }}>Verify</span></span>
        </div>
        <div style={{ display: 'flex', gap: 24, justifyContent: 'center', marginBottom: 20 }}>
          {['Privacy Policy', 'Terms of Service', 'Contact'].map(link => (
            <a key={link} href="#" style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, textDecoration: 'none' }}>{link}</a>
          ))}
        </div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)' }}>
          © 2026 CivicVerify. All rights reserved.
        </div>
      </footer>
    </div>
  )
}
