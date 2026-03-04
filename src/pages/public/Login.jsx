import CanonicalUrl from '../../components/CanonicalUrl'

// src/pages/public/Login.jsx — With Cloudflare Turnstile integration
import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { supabase } from '../../supabaseClient';

var TURNSTILE_SITEKEY = '0x4AAAAAACmS3nBa0g7P2Rba';
var C = { navy: '#0B2545', gold: '#C5960C', cream: '#F5F1EC', red: '#B8352E', green: '#22863A' };
var font = 'Libre Baskerville, Georgia, serif';
var inputStyle = { width: '100%', padding: '12px 16px', fontSize: 14, border: '1px solid rgba(11,37,69,0.1)', borderRadius: 10, outline: 'none', color: '#0B2545', background: '#fff', fontFamily: 'inherit', boxSizing: 'border-box' };
var labelStyle = { display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5, color: 'rgba(11,37,69,0.35)', marginBottom: 6 };

export default function Login() {
  var navigate = useNavigate();
  var [searchParams] = useSearchParams();
  var [email, setEmail] = useState('');
  var [password, setPassword] = useState('');
  var [showPw, setShowPw] = useState(false);
  var [loading, setLoading] = useState(false);
  var [error, setError] = useState('');
  var [captchaToken, setCaptchaToken] = useState('');
  var captchaRef = useRef(null);
  var widgetId = useRef(null);

  var justRegistered = searchParams.get('registered') === 'true';

  // Load Turnstile script
  useEffect(function() {
    if (document.getElementById('turnstile-script')) return;
    var s = document.createElement('script');
    s.id = 'turnstile-script';
    s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    s.async = true;
    document.head.appendChild(s);
  }, []);

  // Render Turnstile widget
  useEffect(function() {
    var interval = setInterval(function() {
      if (window.turnstile && captchaRef.current && widgetId.current === null) {
        widgetId.current = window.turnstile.render(captchaRef.current, {
          sitekey: TURNSTILE_SITEKEY,
          callback: function(token) { setCaptchaToken(token); },
          'expired-callback': function() { setCaptchaToken(''); },
          theme: 'light',
          appearance: 'always'
        });
        clearInterval(interval);
      }
    }, 200);
    return function() { clearInterval(interval); };
  }, []);

  async function handleLogin(e) {
    if (e) e.preventDefault();
    if (!email.trim()) return setError('Email is required');
    if (!password) return setError('Password is required');
    if (!captchaToken) return setError('Please wait for security check to complete');
    setLoading(true);
    setError('');
    var res = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password: password, options: { captchaToken: captchaToken } });
    if (res.error) {
      setLoading(false);
      setCaptchaToken('');
      if (window.turnstile && widgetId.current !== null) window.turnstile.reset(widgetId.current);
      return setError(res.error.message);
    }
    // Fetch role and redirect
    var u = res.data.user;
    var r = await supabase.from('users').select('role').eq('id', u.id).single();
    var role = r.data ? r.data.role : 'citizen';
    if (role === 'admin') navigate('/admin');
    else if (role === 'org') navigate('/org');
    else navigate('/citizen');
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, ' + C.cream + ' 0%, #fff 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 16px', fontFamily: 'DM Sans, -apple-system, sans-serif' }}>
      <CanonicalUrl />
      <div style={{ width: '100%', maxWidth: 440 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, cursor: 'pointer' }} onClick={function(){navigate('/')}}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: C.gold, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: '#fff', fontWeight: 700, fontSize: 16 }}>CV</span>
            </div>
            <span style={{ fontSize: 20, fontWeight: 700, color: C.navy, fontFamily: font }}>CivicVerify</span>
          </div>
        </div>

        {/* Card */}
        <div style={{ background: '#fff', borderRadius: 20, padding: '36px 32px', boxShadow: '0 4px 24px rgba(11,37,69,0.06)', border: '1px solid rgba(11,37,69,0.06)' }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: C.navy, margin: '0 0 4px', fontFamily: font }}>Welcome back</h1>
          <p style={{ fontSize: 14, color: 'rgba(11,37,69,0.4)', margin: '0 0 24px' }}>Sign in to your CivicVerify account</p>

          {justRegistered && !error ? (
            <div style={{ background: C.green + '08', border: '1px solid ' + C.green + '20', borderRadius: 10, padding: '10px 14px', marginBottom: 16 }}>
              <p style={{ fontSize: 13, color: C.green, margin: 0 }}>{'\u2713'} Account created! Please sign in.</p>
            </div>
          ) : null}

          {error ? (
            <div style={{ background: C.red + '08', border: '1px solid ' + C.red + '20', borderRadius: 10, padding: '10px 14px', marginBottom: 16 }}>
              <p style={{ fontSize: 13, color: C.red, margin: 0 }}>{'\u26A0'} {error}</p>
            </div>
          ) : null}

          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Email</label>
            <input type="email" value={email} onChange={function(e){setEmail(e.target.value); setError('')}} placeholder="you@example.com" style={inputStyle} onKeyDown={function(e){if(e.key==='Enter')handleLogin()}} />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Password</label>
            <div style={{ position: 'relative' }}>
              <input type={showPw ? 'text' : 'password'} value={password} onChange={function(e){setPassword(e.target.value); setError('')}} placeholder="Enter your password" style={Object.assign({}, inputStyle, { paddingRight: 44 })} onKeyDown={function(e){if(e.key==='Enter')handleLogin()}} />
              <button onClick={function(){setShowPw(!showPw)}} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: 'rgba(11,37,69,0.25)', padding: 4 }}>{showPw ? '\uD83D\uDE48' : '\uD83D\uDC41'}</button>
            </div>
            <div style={{ textAlign: 'right', marginTop: 6 }}>
              <Link to="/forgot-password" style={{ fontSize: 12, color: C.gold, textDecoration: 'none', fontWeight: 600 }}>Forgot password?</Link>
            </div>
          </div>

          {/* Turnstile — invisible for most users */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
            <div ref={captchaRef}></div>
          </div>

          <button onClick={handleLogin} disabled={loading}
            style={{ width: '100%', padding: 14, background: C.navy, color: '#fff', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 600, cursor: 'pointer', opacity: loading ? 0.6 : 1 }}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>

          <p style={{ textAlign: 'center', fontSize: 13, color: 'rgba(11,37,69,0.35)', marginTop: 20, marginBottom: 0 }}>
            Don't have an account? <Link to="/signup" style={{ color: C.gold, fontWeight: 600, textDecoration: 'none' }}>Sign up</Link>
          </p>
        </div>

        <p style={{ textAlign: 'center', fontSize: 11, color: 'rgba(11,37,69,0.2)', marginTop: 20 }}>
          {'\u00A9'} {new Date().getFullYear()} CivicVerify. One person, one verified voice.
        </p>
      </div>
    </div>
  );
}
