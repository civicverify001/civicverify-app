// src/pages/public/Contact.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

var C = { navy: '#0B2545', gold: '#C5960C', cream: '#F5F1EC', green: '#22863A', white: '#fff' };
var heading = "'Playfair Display', Georgia, serif";
var body = "'DM Sans', -apple-system, sans-serif";

function MailIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
      <rect x="2" y="4" width="20" height="16" rx="2" stroke={C.gold} strokeWidth="2" />
      <path d="M22 7l-10 7L2 7" stroke={C.gold} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function MapPinIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" stroke={C.gold} strokeWidth="2" />
      <circle cx="12" cy="10" r="3" stroke={C.gold} strokeWidth="2" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke={C.gold} strokeWidth="2" />
      <path d="M12 6v6l4 2" stroke={C.gold} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function MessageIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke={C.gold} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function Contact() {
  var navigate = useNavigate();
  var [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  var [sending, setSending] = useState(false);
  var [sent, setSent] = useState(false);

  function handleChange(field) {
    return function (e) {
      setForm(function (prev) {
        var next = Object.assign({}, prev);
        next[field] = e.target.value;
        return next;
      });
    };
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) return;
    setSending(true);
    // Simulate send — replace with real endpoint later
    setTimeout(function () {
      setSending(false);
      setSent(true);
      setForm({ name: '', email: '', subject: '', message: '' });
    }, 1200);
  }

  var contactInfo = [
    { icon: <MailIcon />, title: 'Email Us', detail: 'support@civicverify.com', sub: 'We typically respond within 24 hours' },
    { icon: <MapPinIcon />, title: 'Location', detail: 'United States', sub: 'Serving citizens nationwide' },
    { icon: <ClockIcon />, title: 'Hours', detail: 'Mon \u2013 Fri, 9am \u2013 6pm ET', sub: 'Weekend support via email' },
  ];

  var faqItems = [
    { q: 'How do I verify my identity?', a: 'After signing up, you\u2019ll be guided through a simple identity verification process. It takes just a few minutes and ensures one person, one verified voice.' },
    { q: 'Is my personal information safe?', a: 'Absolutely. All personal data is encrypted and never sold. Only anonymized, aggregated survey results are shared with organizational partners.' },
    { q: 'How do I participate in polls?', a: 'Once verified, polls targeted to your demographics and location will appear on your dashboard. You can vote, comment, and share directly.' },
    { q: 'I\u2019m an organization. How do I create surveys?', a: 'Sign up with an organization account. You\u2019ll get access to our survey builder, demographic targeting, and real-time analytics dashboard.' },
    { q: 'How do I delete my account?', a: 'You can delete your account at any time from your Profile settings. This permanently removes all your personal data from our systems.' },
  ];

  var inputStyle = {
    width: '100%', padding: '14px 18px', fontSize: 14, fontFamily: body,
    border: '1px solid rgba(11,37,69,0.1)', borderRadius: 10, outline: 'none',
    color: C.navy, background: C.white, transition: 'border-color 0.2s',
  };

  var labelStyle = {
    display: 'block', fontSize: 13, fontWeight: 600, color: C.navy,
    marginBottom: 6,
  };

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
            Get Started
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ background: 'linear-gradient(135deg, #0B2545 0%, #132d52 50%, #1a3a66 100%)', padding: '72px 24px 64px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, opacity: 0.03, backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '40px 40px' }} />
        <div style={{ position: 'relative', maxWidth: 600, margin: '0 auto' }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(197,150,12,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
            <MessageIcon />
          </div>
          <h1 style={{ fontSize: 40, fontWeight: 700, color: '#fff', fontFamily: heading, margin: '0 0 16px', lineHeight: 1.2 }}>Get in Touch</h1>
          <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.45)', lineHeight: 1.7, margin: 0 }}>Have a question, suggestion, or partnership inquiry? We\u2019d love to hear from you.</p>
        </div>
      </section>

      {/* Contact Info Cards */}
      <section style={{ maxWidth: 900, margin: '0 auto', padding: '48px 24px 0' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
          {contactInfo.map(function (item, i) {
            return (
              <div key={i} style={{ background: C.white, borderRadius: 14, padding: '28px 24px', border: '1px solid rgba(11,37,69,0.06)', textAlign: 'center' }}>
                <div style={{ width: 52, height: 52, borderRadius: 14, background: C.gold + '12', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>{item.icon}</div>
                <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 2, color: 'rgba(11,37,69,0.3)', margin: '0 0 8px' }}>{item.title}</p>
                <p style={{ fontSize: 16, fontWeight: 700, color: C.navy, margin: '0 0 4px', fontFamily: heading }}>{item.detail}</p>
                <p style={{ fontSize: 13, color: 'rgba(11,37,69,0.35)', margin: 0 }}>{item.sub}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Contact Form */}
      <section style={{ maxWidth: 900, margin: '0 auto', padding: '48px 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'start' }}>
          {/* Form */}
          <div style={{ background: C.white, borderRadius: 16, padding: 32, border: '1px solid rgba(11,37,69,0.06)' }}>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: C.navy, fontFamily: heading, margin: '0 0 4px' }}>Send a Message</h2>
            <p style={{ fontSize: 14, color: 'rgba(11,37,69,0.4)', margin: '0 0 28px', lineHeight: 1.5 }}>Fill out the form and we'll get back to you as soon as possible.</p>

            {sent ? (
              <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                <div style={{ width: 56, height: 56, borderRadius: '50%', background: C.green + '12', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 24 }}>{'\u2713'}</div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: C.navy, margin: '0 0 8px' }}>Message Sent!</h3>
                <p style={{ fontSize: 14, color: 'rgba(11,37,69,0.4)', margin: '0 0 20px', lineHeight: 1.5 }}>Thank you for reaching out. We'll respond within 24 hours.</p>
                <button onClick={function () { setSent(false); }}
                  style={{ padding: '10px 24px', background: C.gold, color: '#fff', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                  <div>
                    <label style={labelStyle}>Name *</label>
                    <input value={form.name} onChange={handleChange('name')} placeholder="Your name" style={inputStyle} required />
                  </div>
                  <div>
                    <label style={labelStyle}>Email *</label>
                    <input value={form.email} onChange={handleChange('email')} type="email" placeholder="you@example.com" style={inputStyle} required />
                  </div>
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label style={labelStyle}>Subject</label>
                  <input value={form.subject} onChange={handleChange('subject')} placeholder="What is this about?" style={inputStyle} />
                </div>
                <div style={{ marginBottom: 24 }}>
                  <label style={labelStyle}>Message *</label>
                  <textarea value={form.message} onChange={handleChange('message')} placeholder="Tell us how we can help..." rows={5}
                    style={Object.assign({}, inputStyle, { resize: 'vertical', lineHeight: 1.6 })} required />
                </div>
                <button type="submit" disabled={sending}
                  style={{ width: '100%', padding: '14px 24px', background: C.gold, color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer', opacity: sending ? 0.6 : 1, transition: 'opacity 0.2s' }}>
                  {sending ? 'Sending...' : 'Send Message'}
                </button>
              </form>
            )}
          </div>

          {/* FAQ */}
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: C.navy, fontFamily: heading, margin: '0 0 4px' }}>Frequently Asked</h2>
            <p style={{ fontSize: 14, color: 'rgba(11,37,69,0.4)', margin: '0 0 24px', lineHeight: 1.5 }}>Quick answers to common questions.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {faqItems.map(function (item, i) {
                return (
                  <div key={i} style={{ background: C.white, borderRadius: 12, padding: '20px 22px', border: '1px solid rgba(11,37,69,0.06)' }}>
                    <p style={{ fontSize: 14, fontWeight: 600, color: C.navy, margin: '0 0 6px' }}>{item.q}</p>
                    <p style={{ fontSize: 13, color: 'rgba(11,37,69,0.4)', margin: 0, lineHeight: 1.6 }}>{item.a}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section style={{ maxWidth: 900, margin: '0 auto', padding: '0 24px 64px' }}>
        <div style={{ background: 'linear-gradient(135deg, #0B2545, #132d52)', borderRadius: 16, padding: '40px 36px', textAlign: 'center' }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: '#fff', margin: '0 0 12px', fontFamily: heading }}>Ready to Join CivicVerify?</h2>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.4)', margin: '0 0 24px', lineHeight: 1.6 }}>Create your free account and start making your verified voice count.</p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
            <button onClick={function () { navigate('/signup'); }}
              style={{ padding: '12px 28px', background: C.gold, color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 16px rgba(197,150,12,0.3)' }}>
              Get Started Free {'\u2192'}
            </button>
            <button onClick={function () { navigate('/'); }}
              style={{ padding: '12px 28px', background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
              Back to Home
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid rgba(11,37,69,0.06)', padding: '24px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <p style={{ fontSize: 12, color: 'rgba(11,37,69,0.25)', margin: 0 }}>{'\u00A9'} {new Date().getFullYear()} CivicVerify. All rights reserved.</p>
        <div style={{ display: 'flex', gap: 20 }}>
          <button onClick={function () { navigate('/about'); }} style={{ fontSize: 12, color: 'rgba(11,37,69,0.3)', background: 'none', border: 'none', cursor: 'pointer' }}>About</button>
          <button onClick={function () { navigate('/privacy'); }} style={{ fontSize: 12, color: 'rgba(11,37,69,0.3)', background: 'none', border: 'none', cursor: 'pointer' }}>Privacy</button>
          <button onClick={function () { navigate('/terms'); }} style={{ fontSize: 12, color: 'rgba(11,37,69,0.3)', background: 'none', border: 'none', cursor: 'pointer' }}>Terms</button>
        </div>
      </footer>
    </div>
  );
}
