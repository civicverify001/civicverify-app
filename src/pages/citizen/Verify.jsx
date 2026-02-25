// src/pages/citizen/Verify.jsx — Identity Verification with Didit Integration
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../hooks/useAuth';

var C = { navy: '#0B2545', gold: '#C5960C', cream: '#F5F1EC', green: '#16a34a', red: '#dc2626', border: 'rgba(11,37,69,0.08)' };
var font = 'Libre Baskerville, Georgia, serif';

export default function Verify() {
  var auth = useAuth();
  var user = auth.user;
  var profile = auth.profile;
  var navigate = useNavigate();

  var [loading, setLoading] = useState(true);
  var [verificationUrl, setVerificationUrl] = useState(null);
  var [sessionStatus, setSessionStatus] = useState(null);
  var [error, setError] = useState('');
  var [starting, setStarting] = useState(false);
  var [showIframe, setShowIframe] = useState(false);
  var [iframeLoading, setIframeLoading] = useState(false);

  // Check current verification status
  var checkStatus = useCallback(async function() {
    if (!user) return;

    // First check if already verified on profile
    if (profile && profile.identity_verified) {
      setSessionStatus('Approved');
      setLoading(false);
      return;
    }

    // Check verification_sessions table
    var result = await supabase
      .from('verification_sessions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (result.data) {
      setSessionStatus(result.data.status);
      if (result.data.verification_url && result.data.status === 'Not Started') {
        setVerificationUrl(result.data.verification_url);
      }
    }
    setLoading(false);
  }, [user, profile]);

  useEffect(function() {
    checkStatus();
  }, [checkStatus]);

  // Poll for status changes while iframe is open
  useEffect(function() {
    if (!showIframe || !user) return;
    var interval = setInterval(async function() {
      // Check if profile got updated
      var result = await supabase
        .from('users')
        .select('identity_verified')
        .eq('id', user.id)
        .single();

      if (result.data && result.data.identity_verified) {
        setSessionStatus('Approved');
        setShowIframe(false);
        clearInterval(interval);
      }

      // Also check session status
      var sessionResult = await supabase
        .from('verification_sessions')
        .select('status')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (sessionResult.data) {
        var s = sessionResult.data.status;
        if (s === 'Approved' || s === 'Declined') {
          setSessionStatus(s);
          setShowIframe(false);
          clearInterval(interval);
        }
      }
    }, 5000); // Check every 5 seconds

    return function() { clearInterval(interval); };
  }, [showIframe, user]);

  // Start verification — create a Didit session
  async function startVerification() {
    setStarting(true);
    setError('');
    try {
      var session = await supabase.auth.getSession();
      var token = session.data.session.access_token;

      var response = await fetch(
        'https://jfdrpaumemdzkipbbptm.supabase.co/functions/v1/create-verification-session',
        {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
        }
      );

      if (!response.ok) {
        var errData = await response.json().catch(function() { return {}; });
        throw new Error(errData.error || 'Failed to create verification session');
      }

      var data = await response.json();
      setVerificationUrl(data.verification_url);
      setSessionStatus(data.status);
      setShowIframe(true);
      setIframeLoading(true);
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    }
    setStarting(false);
  }

  // -- RENDER --

  if (loading) {
    return (
      <div style={{ fontFamily: 'DM Sans, sans-serif', maxWidth: 720, margin: '0 auto' }}>
        <style>{'@keyframes spin{to{transform:rotate(360deg)}}'}</style>
        <div style={{ textAlign: 'center', padding: '80px 20px' }}>
          <div style={{ width: 36, height: 36, border: '3px solid ' + C.gold + '30', borderTopColor: C.gold, borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
          <p style={{ fontSize: 14, color: 'rgba(11,37,69,0.4)' }}>Checking verification status...</p>
        </div>
      </div>
    );
  }

  // APPROVED — already verified
  if (sessionStatus === 'Approved' || (profile && profile.identity_verified)) {
    return (
      <div style={{ fontFamily: 'DM Sans, sans-serif', maxWidth: 720, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ width: 88, height: 88, borderRadius: '50%', background: C.green + '10', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', border: '3px solid ' + C.green + '25' }}>
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
              <path d="M12 20l6 6 10-10" stroke={C.green} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: C.navy, margin: '0 0 8px', fontFamily: font }}>Identity Verified</h1>
          <p style={{ fontSize: 15, color: 'rgba(11,37,69,0.5)', margin: '0 0 32px', lineHeight: 1.6, maxWidth: 400, marginLeft: 'auto', marginRight: 'auto' }}>
            Your identity has been verified successfully. You now have full access to all surveys and the verified badge on your profile.
          </p>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '14px 28px', background: C.green + '08', borderRadius: 14, border: '1px solid ' + C.green + '20', marginBottom: 32 }}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M9 1l2.47 4.33L16 6.27l-3.18 3.42.56 4.84L9 12.5l-4.38 2.03.56-4.84L2 6.27l4.53-.94L9 1z" fill={C.green} opacity="0.15" stroke={C.green} strokeWidth="1.5"/>
            </svg>
            <span style={{ fontSize: 15, fontWeight: 700, color: C.green }}>Verified Citizen</span>
          </div>
          <div>
            <button onClick={function() { navigate('/citizen'); }} style={{ padding: '13px 32px', background: C.navy, color: '#fff', border: 'none', borderRadius: 11, fontSize: 14, fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 16px rgba(11,37,69,0.15)' }}>
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // DECLINED — verification was rejected
  if (sessionStatus === 'Declined') {
    return (
      <div style={{ fontFamily: 'DM Sans, sans-serif', maxWidth: 720, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ width: 88, height: 88, borderRadius: '50%', background: C.red + '08', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', border: '3px solid ' + C.red + '15' }}>
            <span style={{ fontSize: 40 }}>{'\u26A0\uFE0F'}</span>
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: C.navy, margin: '0 0 8px', fontFamily: font }}>Verification Not Approved</h1>
          <p style={{ fontSize: 15, color: 'rgba(11,37,69,0.5)', margin: '0 0 16px', lineHeight: 1.6, maxWidth: 420, marginLeft: 'auto', marginRight: 'auto' }}>
            Your identity verification was not approved. This can happen if the document was unclear, expired, or didn't match the selfie.
          </p>
          <div style={{ background: 'rgba(11,37,69,0.03)', border: '1px solid ' + C.border, borderRadius: 14, padding: '18px 22px', maxWidth: 400, margin: '0 auto 28px', textAlign: 'left' }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: C.navy, margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: 0.5 }}>Common reasons</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {['Blurry or obscured document photo', 'Expired ID document', 'Selfie didn\'t match ID photo', 'Document type not supported'].map(function(tip, i) {
                return <span key={i} style={{ fontSize: 13, color: 'rgba(11,37,69,0.55)', lineHeight: 1.4 }}>{'\u2022'} {tip}</span>;
              })}
            </div>
          </div>
          <button onClick={function() { setSessionStatus(null); setVerificationUrl(null); setShowIframe(false); setError(''); }} style={{ padding: '14px 32px', background: C.gold, color: '#fff', border: 'none', borderRadius: 11, fontSize: 14, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 16px rgba(197,150,12,0.3)' }}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // IN PROGRESS or IN REVIEW — waiting for result
  if (sessionStatus === 'In Progress' || sessionStatus === 'In Review') {
    return (
      <div style={{ fontFamily: 'DM Sans, sans-serif', maxWidth: 720, margin: '0 auto' }}>
        <style>{'@keyframes spin{to{transform:rotate(360deg)}} @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}'}</style>
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ width: 88, height: 88, borderRadius: '50%', background: C.gold + '10', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', border: '3px solid ' + C.gold + '25' }}>
            <div style={{ width: 36, height: 36, border: '3px solid ' + C.gold + '30', borderTopColor: C.gold, borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: C.navy, margin: '0 0 8px', fontFamily: font }}>Verification In Progress</h1>
          <p style={{ fontSize: 15, color: 'rgba(11,37,69,0.5)', margin: '0 0 28px', lineHeight: 1.6, maxWidth: 420, marginLeft: 'auto', marginRight: 'auto' }}>
            Your documents are being reviewed. This usually takes just a few moments.
          </p>

          {/* Progress tracker */}
          <div style={{ display: 'inline-flex', flexDirection: 'column', gap: 14, padding: '22px 30px', background: 'rgba(11,37,69,0.03)', borderRadius: 16, border: '1px solid ' + C.border, textAlign: 'left', marginBottom: 28 }}>
            {[
              { label: 'Documents uploaded', done: true },
              { label: 'Identity check', active: sessionStatus === 'In Progress' },
              { label: 'Review complete', done: false },
            ].map(function(step, i) {
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 26, height: 26, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    background: step.done ? C.green : step.active ? C.gold : 'rgba(11,37,69,0.08)',
                  }}>
                    {step.done
                      ? <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      : step.active
                        ? <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff', animation: 'pulse 1.5s infinite' }} />
                        : <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'rgba(11,37,69,0.2)' }} />
                    }
                  </div>
                  <span style={{ fontSize: 14, fontWeight: step.done || step.active ? 600 : 400, color: step.done ? C.green : step.active ? C.navy : 'rgba(11,37,69,0.35)' }}>
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>

          <div>
            <p style={{ fontSize: 12, color: 'rgba(11,37,69,0.3)', marginBottom: 16, animation: 'pulse 2s infinite' }}>Checking status automatically...</p>
            <button onClick={function() { navigate('/citizen'); }} style={{ padding: '12px 28px', background: 'rgba(11,37,69,0.06)', color: C.navy, border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // IFRAME VIEW — Didit verification in progress
  if (showIframe && verificationUrl) {
    return (
      <div style={{ fontFamily: 'DM Sans, sans-serif', maxWidth: 720, margin: '0 auto' }}>
        <style>{'@keyframes spin{to{transform:rotate(360deg)}}'}</style>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: C.navy, margin: '0 0 4px', fontFamily: font }}>Identity Verification</h1>
            <p style={{ fontSize: 13, color: 'rgba(11,37,69,0.4)', margin: 0 }}>Follow the steps below to verify your identity</p>
          </div>
          <button onClick={function() { setShowIframe(false); checkStatus(); }} style={{ padding: '8px 16px', background: 'rgba(11,37,69,0.06)', color: 'rgba(11,37,69,0.5)', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
            Cancel
          </button>
        </div>

        {/* Security badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: C.green + '06', borderRadius: 10, border: '1px solid ' + C.green + '15', marginBottom: 16 }}>
          <span style={{ fontSize: 14 }}>{'\uD83D\uDD12'}</span>
          <span style={{ fontSize: 12, color: C.green, fontWeight: 600 }}>Secure verification powered by Didit</span>
        </div>

        {/* Iframe container */}
        <div style={{ position: 'relative', borderRadius: 16, overflow: 'hidden', border: '1px solid ' + C.border, boxShadow: '0 4px 24px rgba(11,37,69,0.08)', background: '#fff' }}>
          {iframeLoading && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff', zIndex: 2 }}>
              <div>
                <div style={{ width: 36, height: 36, border: '3px solid ' + C.gold + '30', borderTopColor: C.gold, borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
                <p style={{ fontSize: 13, color: 'rgba(11,37,69,0.4)' }}>Loading verification...</p>
              </div>
            </div>
          )}
          <iframe
            src={verificationUrl}
            title="Identity Verification"
            style={{ width: '100%', height: 700, border: 'none', display: 'block' }}
            allow="camera; microphone; fullscreen; autoplay; encrypted-media"
            onLoad={function() { setIframeLoading(false); }}
          />
        </div>

        <p style={{ fontSize: 11, color: 'rgba(11,37,69,0.25)', textAlign: 'center', marginTop: 12 }}>
          Your documents are processed securely and never stored on our servers.
        </p>
      </div>
    );
  }

  // DEFAULT — Start verification
  return (
    <div style={{ fontFamily: 'DM Sans, sans-serif', maxWidth: 720, margin: '0 auto' }}>
      <style>{'@keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}} @keyframes spin{to{transform:rotate(360deg)}}'}</style>

      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: C.navy, margin: '0 0 6px', fontFamily: font }}>Verify Your Identity</h1>
        <p style={{ fontSize: 14, color: 'rgba(11,37,69,0.45)', margin: 0 }}>Quick and secure — takes less than 2 minutes.</p>
      </div>

      {/* Main card */}
      <div style={{ background: '#fff', borderRadius: 20, border: '1px solid ' + C.border, boxShadow: '0 4px 24px rgba(11,37,69,0.05)', padding: '40px 32px', animation: 'fadeUp 0.4s ease-out', textAlign: 'center' }}>

        {/* Icon */}
        <div style={{ width: 80, height: 80, borderRadius: 20, background: 'linear-gradient(135deg, ' + C.gold + '15, ' + C.gold + '08)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', border: '2px solid ' + C.gold + '20' }}>
          <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
            <rect x="6" y="8" width="24" height="18" rx="3" stroke={C.gold} strokeWidth="2.5" fill="none"/>
            <circle cx="16" cy="16" r="3.5" stroke={C.gold} strokeWidth="2"/>
            <line x1="22" y1="13" x2="27" y2="13" stroke={C.gold} strokeWidth="2" strokeLinecap="round"/>
            <line x1="22" y1="17" x2="25" y2="17" stroke={C.gold} strokeWidth="2" strokeLinecap="round"/>
            <path d="M10 23c0-2.5 3-4 6-4s6 1.5 6 4" stroke={C.gold} strokeWidth="2" strokeLinecap="round" fill="none"/>
          </svg>
        </div>

        <h2 style={{ fontSize: 22, fontWeight: 700, color: C.navy, margin: '0 0 8px', fontFamily: font }}>Confirm Your Identity</h2>
        <p style={{ fontSize: 15, color: 'rgba(11,37,69,0.5)', margin: '0 0 28px', lineHeight: 1.6, maxWidth: 420, marginLeft: 'auto', marginRight: 'auto' }}>
          Verify your identity to unlock all surveys, earn the verified badge, and participate fully in civic discussions.
        </p>

        {/* What you'll need */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 32, maxWidth: 460, margin: '0 auto 32px' }}>
          {[
            { icon: '\uD83C\uDD94', label: 'Government ID', desc: "Driver's license, passport, or state ID" },
            { icon: '\uD83E\uDD33', label: 'Quick Selfie', desc: 'To match your face with your ID' },
            { icon: '\u23F1\uFE0F', label: 'Under 2 min', desc: 'Fast, AI-powered verification' },
          ].map(function(item, i) {
            return (
              <div key={i} style={{ padding: '16px 12px', background: 'rgba(11,37,69,0.025)', borderRadius: 14, border: '1px solid ' + C.border }}>
                <div style={{ fontSize: 24, marginBottom: 8 }}>{item.icon}</div>
                <p style={{ fontSize: 13, fontWeight: 700, color: C.navy, margin: '0 0 3px' }}>{item.label}</p>
                <p style={{ fontSize: 11, color: 'rgba(11,37,69,0.4)', margin: 0, lineHeight: 1.4 }}>{item.desc}</p>
              </div>
            );
          })}
        </div>

        {/* How it works */}
        <div style={{ textAlign: 'left', maxWidth: 400, margin: '0 auto 32px', padding: '20px 24px', background: 'rgba(11,37,69,0.02)', borderRadius: 14 }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: C.navy, margin: '0 0 14px', textTransform: 'uppercase', letterSpacing: 0.5 }}>How it works</p>
          {[
            { num: '1', text: 'Take a photo of your government-issued ID' },
            { num: '2', text: 'Take a quick selfie for face verification' },
            { num: '3', text: 'AI verifies your identity in seconds' },
          ].map(function(step, i) {
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: i < 2 ? 12 : 0 }}>
                <div style={{ width: 26, height: 26, borderRadius: '50%', background: C.gold + '15', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: 12, fontWeight: 800, color: C.gold }}>{step.num}</span>
                </div>
                <span style={{ fontSize: 13, color: 'rgba(11,37,69,0.6)' }}>{step.text}</span>
              </div>
            );
          })}
        </div>

        {/* Error */}
        {error && (
          <div style={{ padding: '12px 16px', background: C.red + '08', border: '1px solid ' + C.red + '20', borderRadius: 10, marginBottom: 20, maxWidth: 400, margin: '0 auto 20px' }}>
            <p style={{ fontSize: 13, color: C.red, margin: 0 }}>{error}</p>
          </div>
        )}

        {/* Start button */}
        <button onClick={startVerification} disabled={starting} style={{
          padding: '16px 40px', background: starting ? 'rgba(11,37,69,0.08)' : C.gold, color: '#fff', border: 'none', borderRadius: 12, fontSize: 16, fontWeight: 700, cursor: starting ? 'wait' : 'pointer',
          boxShadow: starting ? 'none' : '0 6px 24px rgba(197,150,12,0.3)', transition: 'all 0.2s',
          display: 'inline-flex', alignItems: 'center', gap: 10,
        }}>
          {starting && <div style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />}
          {starting ? 'Starting...' : 'Start Verification'}
        </button>

        {/* Privacy note */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 20 }}>
          <span style={{ fontSize: 12 }}>{'\uD83D\uDD12'}</span>
          <span style={{ fontSize: 12, color: 'rgba(11,37,69,0.3)' }}>256-bit encrypted · Documents never stored on our servers</span>
        </div>
      </div>
    </div>
  );
}

