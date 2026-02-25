// src/pages/public/About.jsx
import { useNavigate } from 'react-router-dom';

var C = { navy: '#0B2545', gold: '#C5960C', cream: '#F5F1EC', white: '#fff' };
var heading = "'Playfair Display', Georgia, serif";
var body = "'DM Sans', -apple-system, sans-serif";

function Shield() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke={C.gold} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 12l2 2 4-4" stroke={C.gold} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Lock() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="11" width="18" height="11" rx="2" stroke={C.gold} strokeWidth="2" />
      <path d="M7 11V7a5 5 0 0110 0v4" stroke={C.gold} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function Eye() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z" stroke={C.gold} strokeWidth="2" />
      <circle cx="12" cy="12" r="3" stroke={C.gold} strokeWidth="2" />
    </svg>
  );
}

function Users() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke={C.gold} strokeWidth="2" strokeLinecap="round" />
      <circle cx="9" cy="7" r="4" stroke={C.gold} strokeWidth="2" />
      <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke={C.gold} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function Scale() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
      <path d="M12 3v18M3 7l3 9h12l3-9" stroke={C.gold} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="6" cy="16" r="3" stroke={C.gold} strokeWidth="1.5" />
      <circle cx="18" cy="16" r="3" stroke={C.gold} strokeWidth="1.5" />
    </svg>
  );
}

function Globe() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke={C.gold} strokeWidth="2" />
      <path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10A15.3 15.3 0 0112 2z" stroke={C.gold} strokeWidth="2" />
    </svg>
  );
}

export default function About() {
  var navigate = useNavigate();

  var values = [
    { icon: <Eye />, title: 'Transparency', desc: 'Every aspect of how we collect, store, and use data is documented and accessible. No hidden agendas, no fine print surprises.' },
    { icon: <Scale />, title: 'Non-Partisanship', desc: 'CivicVerify is politically neutral. We do not endorse candidates, parties, or ideologies. Our surveys are designed to capture honest opinions — not push narratives.' },
    { icon: <Lock />, title: 'Privacy First', desc: 'Your personal information is encrypted at rest and in transit. We never sell individual data. Only anonymized, aggregated insights are shared with organizational partners.' },
    { icon: <Shield />, title: 'Verified Integrity', desc: 'Identity verification ensures one person equals one voice. This eliminates bots, duplicate accounts, and manipulation — producing data organizations can actually trust.' },
    { icon: <Users />, title: 'Inclusivity', desc: 'Every citizen deserves to be heard. Our platform is designed to be accessible, intuitive, and welcoming to people of all backgrounds and technical abilities.' },
    { icon: <Globe />, title: 'Civic Impact', desc: 'We believe informed communities build stronger democracies. Every survey response, every discussion, and every verified voice contributes to a clearer picture of what citizens think.' },
  ];

  var trustItems = [
    {
      title: 'Industry-Standard Identity Verification',
      desc: 'We partner with leading identity verification providers that use document scanning and biometric matching to confirm each user is a real, unique person. The verification process is fast, secure, and compliant with data protection regulations.',
    },
    {
      title: 'End-to-End Encryption',
      desc: 'All data transmitted between your device and our servers is encrypted using TLS 1.3. Personal identification documents are processed in an isolated, secure environment and are never stored on our servers after verification.',
    },
    {
      title: 'Anonymized Data Only',
      desc: 'When survey results are shared with organizational partners, all data is fully anonymized and aggregated. No individual responses can ever be traced back to a specific user.',
    },
    {
      title: 'Regular Security Audits',
      desc: 'Our infrastructure undergoes regular security assessments. We follow OWASP best practices and maintain strict access controls with role-based permissions for all team members.',
    },
    {
      title: 'Your Data, Your Control',
      desc: 'You can view, export, or delete your data at any time from your account settings. Account deletion permanently removes all personal information from our systems.',
    },
  ];

  return (
    <div style={{ fontFamily: body, color: C.navy, background: C.cream, minHeight: '100vh' }}>
      {/* Nav */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 50, padding: '16px 32px',
        background: 'rgba(245,241,236,0.9)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(11,37,69,0.06)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }} onClick={function () { navigate('/'); }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: C.gold, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: '#fff', fontWeight: 700, fontSize: 12, fontFamily: body }}>CV</span>
          </div>
          <span style={{ fontSize: 18, fontWeight: 700, color: C.navy, fontFamily: heading }}>Civic<span style={{ color: C.gold }}>Verify</span></span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={function () { navigate('/login'); }}
            style={{ padding: '9px 20px', background: 'transparent', border: '1px solid rgba(11,37,69,0.12)', borderRadius: 8, fontSize: 13, fontWeight: 600, color: C.navy, cursor: 'pointer', fontFamily: body }}>
            Log In
          </button>
          <button onClick={function () { navigate('/signup'); }}
            style={{ padding: '9px 20px', background: C.navy, border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, color: '#fff', cursor: 'pointer', fontFamily: body }}>
            Sign Up
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section style={{
        padding: '80px 32px 60px', textAlign: 'center', maxWidth: 800, margin: '0 auto',
      }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 16px',
          background: C.gold + '15', border: '1px solid ' + C.gold + '30', borderRadius: 40,
          fontSize: 12, fontWeight: 700, color: C.gold, textTransform: 'uppercase', letterSpacing: 1,
          marginBottom: 24, fontFamily: body,
        }}>
          <Shield /> Our Mission
        </div>
        <h1 style={{ fontSize: 44, fontWeight: 700, color: C.navy, margin: '0 0 20px', lineHeight: 1.2, fontFamily: heading }}>
          Building Trust in<br />Civic Engagement
        </h1>
        <p style={{ fontSize: 18, lineHeight: 1.7, color: 'rgba(11,37,69,0.55)', maxWidth: 620, margin: '0 auto', fontFamily: body }}>
          CivicVerify was created with a simple belief: democracy works better when every voice is verified, every opinion is authentic, and every citizen has an equal opportunity to be heard.
        </p>
      </section>

      {/* Mission */}
      <section style={{ padding: '0 32px 60px', maxWidth: 900, margin: '0 auto' }}>
        <div style={{
          background: C.white, borderRadius: 20, padding: '40px 48px',
          border: '1px solid rgba(11,37,69,0.06)', boxShadow: '0 4px 24px rgba(11,37,69,0.06)',
        }}>
          <h2 style={{ fontSize: 13, fontWeight: 700, color: C.gold, textTransform: 'uppercase', letterSpacing: 1.5, margin: '0 0 14px', fontFamily: body }}>Our Story</h2>
          <p style={{ fontSize: 16, lineHeight: 1.8, color: 'rgba(11,37,69,0.65)', margin: '0 0 16px', fontFamily: body }}>
            In an era of misinformation, bot-driven narratives, and eroding trust in institutions, CivicVerify was born from a fundamental question: <em style={{ color: C.navy, fontWeight: 600 }}>What if we could create a space where every civic opinion is tied to a verified, real person?</em>
          </p>
          <p style={{ fontSize: 16, lineHeight: 1.8, color: 'rgba(11,37,69,0.65)', margin: '0 0 16px', fontFamily: body }}>
            Traditional polling is broken. Online surveys are easily manipulated. Social media amplifies the loudest voices, not the most representative ones. CivicVerify takes a different approach — by verifying the identity of every participant, we ensure that the data reflects real communities, not algorithms.
          </p>
          <p style={{ fontSize: 16, lineHeight: 1.8, color: 'rgba(11,37,69,0.65)', margin: 0, fontFamily: body }}>
            For citizens, CivicVerify is a place to make your voice count on the issues that matter to you. For organizations — nonprofits, researchers, government agencies — it is a source of verified, trustworthy public opinion data that can inform real decisions.
          </p>
        </div>
      </section>

      {/* Values */}
      <section style={{ padding: '0 32px 80px', maxWidth: 900, margin: '0 auto' }}>
        <h2 style={{ fontSize: 32, fontWeight: 700, color: C.navy, margin: '0 0 12px', textAlign: 'center', fontFamily: heading }}>Our Values</h2>
        <p style={{ fontSize: 15, color: 'rgba(11,37,69,0.45)', textAlign: 'center', margin: '0 0 40px', fontFamily: body }}>The principles that guide every decision we make.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 }}>
          {values.map(function (v) {
            return (
              <div key={v.title} style={{
                background: C.white, borderRadius: 16, padding: '28px 24px',
                border: '1px solid rgba(11,37,69,0.06)',
                boxShadow: '0 2px 12px rgba(11,37,69,0.04)',
                transition: 'transform 0.2s, box-shadow 0.2s',
              }}
                onMouseEnter={function (e) { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(11,37,69,0.1)'; }}
                onMouseLeave={function (e) { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 2px 12px rgba(11,37,69,0.04)'; }}
              >
                <div style={{
                  width: 48, height: 48, borderRadius: 12, background: C.gold + '12',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16,
                }}>
                  {v.icon}
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: C.navy, margin: '0 0 8px', fontFamily: body }}>{v.title}</h3>
                <p style={{ fontSize: 14, lineHeight: 1.65, color: 'rgba(11,37,69,0.5)', margin: 0, fontFamily: body }}>{v.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Trust & Safety */}
      <section style={{ background: C.navy, padding: '80px 32px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 16px',
              background: C.gold + '20', border: '1px solid ' + C.gold + '40', borderRadius: 40,
              fontSize: 12, fontWeight: 700, color: C.gold, textTransform: 'uppercase', letterSpacing: 1,
              marginBottom: 20, fontFamily: body,
            }}>
              <Lock /> Trust & Safety
            </div>
            <h2 style={{ fontSize: 36, fontWeight: 700, color: C.white, margin: '0 0 14px', fontFamily: heading }}>How We Protect You</h2>
            <p style={{ fontSize: 16, lineHeight: 1.7, color: 'rgba(255,255,255,0.5)', maxWidth: 560, margin: '0 auto', fontFamily: body }}>
              Security is not a feature — it is the foundation of everything we build. Here is exactly how we safeguard your data and identity.
            </p>
          </div>

          <div style={{ display: 'grid', gap: 16 }}>
            {trustItems.map(function (item, i) {
              return (
                <div key={i} style={{
                  background: 'rgba(255,255,255,0.04)', borderRadius: 16,
                  padding: '24px 28px', border: '1px solid rgba(255,255,255,0.08)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: 8, background: C.gold + '20',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 14, fontWeight: 700, color: C.gold, fontFamily: body,
                    }}>
                      {i + 1}
                    </div>
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: C.white, margin: 0, fontFamily: body }}>{item.title}</h3>
                  </div>
                  <p style={{ fontSize: 14, lineHeight: 1.7, color: 'rgba(255,255,255,0.5)', margin: '0 0 0 40px', fontFamily: body }}>{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '80px 32px', textAlign: 'center' }}>
        <h2 style={{ fontSize: 32, fontWeight: 700, color: C.navy, margin: '0 0 14px', fontFamily: heading }}>Ready to Make Your Voice Count?</h2>
        <p style={{ fontSize: 16, color: 'rgba(11,37,69,0.45)', margin: '0 0 28px', fontFamily: body }}>Join a growing community of verified citizens shaping civic discourse.</p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button onClick={function () { navigate('/signup'); }}
            style={{ padding: '14px 32px', background: C.gold, color: '#fff', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: body, boxShadow: '0 4px 16px rgba(197,150,12,0.3)' }}>
            Create Free Account
          </button>
          <button onClick={function () { navigate('/'); }}
            style={{ padding: '14px 32px', background: 'transparent', color: C.navy, border: '1px solid rgba(11,37,69,0.12)', borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: body }}>
            Back to Home
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        padding: '32px', borderTop: '1px solid rgba(11,37,69,0.08)',
        textAlign: 'center', fontSize: 13, color: 'rgba(11,37,69,0.3)', fontFamily: body,
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginBottom: 12 }}>
          <span style={{ cursor: 'pointer' }} onClick={function () { navigate('/privacy'); }}>Privacy Policy</span>
          <span style={{ cursor: 'pointer' }} onClick={function () { navigate('/terms'); }}>Terms of Service</span>
          <span style={{ cursor: 'pointer' }} onClick={function () { navigate('/contact'); }}>Contact</span>
        </div>
        &copy; {new Date().getFullYear()} CivicVerify. All rights reserved.
      </footer>
    </div>
  );
}
