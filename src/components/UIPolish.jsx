// src/components/UIPolish.jsx — Reusable UI Polish Components
// Phase 7: Skeleton loaders, Error Boundary, Toast system, Page transitions, Empty states
import { useState, useEffect, useCallback, createContext, useContext, Component } from 'react';

var C = { navy: '#0B2545', gold: '#C5960C', darkGold: '#a07a0a', green: '#16a34a' };

// ═══════════════════════════════════════════════════════════════
// SKELETON LOADERS — Use while data is loading
// ═══════════════════════════════════════════════════════════════

export function SkeletonText({ lines, width }) {
  lines = lines || 3;
  var widths = ['long', 'full', 'medium', 'short', 'long', 'medium'];
  return (
    <div>
      {Array.from({ length: lines }).map(function(_, i) {
        return <div key={i} className={'cv-skeleton cv-skeleton-text ' + (width || widths[i % widths.length])} />;
      })}
    </div>
  );
}

export function SkeletonCard({ height }) {
  return (
    <div className="cv-skeleton-card" style={{ height: height || 'auto' }}>
      <div className="cv-skeleton cv-skeleton-title" />
      <SkeletonText lines={3} />
    </div>
  );
}

export function SkeletonStatCards({ count }) {
  count = count || 4;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }} className="cv-grid-4">
      {Array.from({ length: count }).map(function(_, i) {
        return (
          <div key={i} className="cv-skeleton-stat-card cv-stagger-' + (i + 1)" style={{ animationDelay: (i * 0.05) + 's' }}>
            <div className="cv-skeleton cv-skeleton-badge" style={{ marginBottom: 12 }} />
            <div className="cv-skeleton" style={{ height: 28, width: '40%', borderRadius: 6, marginBottom: 8 }} />
            <div className="cv-skeleton cv-skeleton-text short" />
          </div>
        );
      })}
    </div>
  );
}

export function SkeletonList({ count, showAvatar }) {
  count = count || 5;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {Array.from({ length: count }).map(function(_, i) {
        return (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', borderRadius: 12, background: '#fff', border: '1px solid rgba(11,37,69,0.04)' }}>
            {showAvatar !== false && <div className="cv-skeleton cv-skeleton-avatar" />}
            <div style={{ flex: 1 }}>
              <div className="cv-skeleton cv-skeleton-text medium" style={{ marginBottom: 6 }} />
              <div className="cv-skeleton cv-skeleton-text short" />
            </div>
            <div className="cv-skeleton cv-skeleton-badge" />
          </div>
        );
      })}
    </div>
  );
}

export function SkeletonSurveyCard() {
  return (
    <div className="cv-skeleton-card" style={{ padding: '20px 22px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
        <div className="cv-skeleton cv-skeleton-badge" />
        <div className="cv-skeleton" style={{ width: 60, height: 20, borderRadius: 6 }} />
      </div>
      <div className="cv-skeleton cv-skeleton-title" style={{ width: '70%' }} />
      <SkeletonText lines={2} />
      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <div className="cv-skeleton cv-skeleton-btn" />
        <div className="cv-skeleton cv-skeleton-btn" style={{ width: 80 }} />
      </div>
    </div>
  );
}

export function SkeletonDebateCard() {
  return (
    <div className="cv-skeleton-card" style={{ padding: '20px 22px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
        <div className="cv-skeleton cv-skeleton-badge" style={{ width: 60 }} />
        <div className="cv-skeleton" style={{ width: 80, height: 18, borderRadius: 6 }} />
      </div>
      <div className="cv-skeleton" style={{ height: 20, width: '80%', borderRadius: 6, marginBottom: 10 }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <div className="cv-skeleton cv-skeleton-avatar" style={{ width: 32, height: 32 }} />
        <div className="cv-skeleton" style={{ width: 80, height: 14, borderRadius: 6 }} />
        <div className="cv-skeleton" style={{ width: 20, height: 14, borderRadius: 6 }} />
        <div className="cv-skeleton cv-skeleton-avatar" style={{ width: 32, height: 32 }} />
        <div className="cv-skeleton" style={{ width: 80, height: 14, borderRadius: 6 }} />
      </div>
    </div>
  );
}

// Full page skeleton for Dashboard
export function SkeletonDashboard() {
  return (
    <div className="cv-page-enter">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <div>
          <div className="cv-skeleton" style={{ height: 28, width: 200, borderRadius: 8, marginBottom: 8 }} />
          <div className="cv-skeleton" style={{ height: 14, width: 280, borderRadius: 6 }} />
        </div>
        <div className="cv-skeleton cv-skeleton-btn" style={{ width: 140 }} />
      </div>
      {/* Stat cards */}
      <SkeletonStatCards count={4} />
      {/* Content */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 24 }} className="cv-grid-2">
        <SkeletonCard height={300} />
        <SkeletonCard height={300} />
      </div>
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════
// PAGE WRAPPER — Adds fade-in transition to any page
// ═══════════════════════════════════════════════════════════════

export function PageWrapper({ children, loading, skeleton }) {
  if (loading && skeleton) return skeleton;
  if (loading) return (
    <div className="cv-loading-page">
      <div className="cv-spinner" />
      <p className="cv-loading-text">Loading...</p>
    </div>
  );
  return <div className="cv-page-enter">{children}</div>;
}


// ═══════════════════════════════════════════════════════════════
// EMPTY STATE — Reusable empty state component
// ═══════════════════════════════════════════════════════════════

export function EmptyState({ icon, title, description, action, actionLabel, actionIcon }) {
  return (
    <div className="cv-empty">
      <div className="cv-empty-icon"><span>{icon || '📭'}</span></div>
      <p className="cv-empty-title">{title || 'Nothing here yet'}</p>
      <p className="cv-empty-text">{description || 'Check back later for updates.'}</p>
      {action && (
        <button onClick={action} className="cv-btn cv-btn-primary" style={{ padding: '12px 28px', fontSize: 13 }}>
          {actionIcon && <span style={{ marginRight: 6 }}>{actionIcon}</span>}
          {actionLabel || 'Get Started'}
        </button>
      )}
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════
// ERROR BOUNDARY — Catches React rendering errors
// ═══════════════════════════════════════════════════════════════

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error: error };
  }

  componentDidCatch(error, info) {
    console.error('[CivicVerify Error Boundary]', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="cv-error-boundary">
          <div className="cv-error-icon"><span>⚠️</span></div>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: C.navy, margin: '0 0 8px' }}>Something went wrong</h3>
          <p style={{ fontSize: 13, color: 'rgba(11,37,69,0.5)', margin: '0 0 20px', maxWidth: 360, marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.5 }}>
            We hit an unexpected error. Try refreshing the page or contact support if this persists.
          </p>
          <button
            onClick={function() { window.location.reload(); }}
            className="cv-btn cv-btn-primary"
            style={{ padding: '12px 28px', fontSize: 13 }}
          >
            🔄 Refresh Page
          </button>
          {this.state.error && (
            <details style={{ marginTop: 20, textAlign: 'left', maxWidth: 500, marginLeft: 'auto', marginRight: 'auto' }}>
              <summary style={{ fontSize: 12, color: 'rgba(11,37,69,0.4)', cursor: 'pointer' }}>Technical Details</summary>
              <pre style={{ fontSize: 11, color: 'rgba(11,37,69,0.5)', background: 'rgba(11,37,69,0.03)', padding: 12, borderRadius: 8, overflow: 'auto', marginTop: 8 }}>
                {this.state.error.toString()}
              </pre>
            </details>
          )}
        </div>
      );
    }
    return this.props.children;
  }
}


// ═══════════════════════════════════════════════════════════════
// TOAST NOTIFICATION SYSTEM
// ═══════════════════════════════════════════════════════════════

var ToastContext = createContext(null);

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }) {
  var [toasts, setToasts] = useState([]);

  var addToast = useCallback(function(message, type, duration) {
    var id = Date.now() + Math.random();
    setToasts(function(prev) { return prev.concat([{ id: id, message: message, type: type || 'info', exiting: false }]); });
    setTimeout(function() {
      setToasts(function(prev) { return prev.map(function(t) { return t.id === id ? Object.assign({}, t, { exiting: true }) : t; }); });
      setTimeout(function() {
        setToasts(function(prev) { return prev.filter(function(t) { return t.id !== id; }); });
      }, 300);
    }, duration || 4000);
    return id;
  }, []);

  var toast = useCallback(function(message, type) { return addToast(message, type); }, [addToast]);
  toast.success = function(msg) { return addToast(msg, 'success'); };
  toast.error = function(msg) { return addToast(msg, 'error'); };
  toast.info = function(msg) { return addToast(msg, 'info'); };
  toast.warning = function(msg) { return addToast(msg, 'warning'); };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="cv-toast-container">
        {toasts.map(function(t) {
          var icons = { success: '✓', error: '✕', info: 'ℹ', warning: '⚠' };
          return (
            <div key={t.id} className={'cv-toast cv-toast-' + t.type + (t.exiting ? ' exit' : '')}>
              <span style={{ fontSize: 16, flexShrink: 0 }}>{icons[t.type] || 'ℹ'}</span>
              <span>{t.message}</span>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}


// ═══════════════════════════════════════════════════════════════
// LOADING BUTTON — Button with loading state
// ═══════════════════════════════════════════════════════════════

export function LoadingButton({ loading, children, className, style, onClick, disabled }) {
  return (
    <button
      className={'cv-btn ' + (className || 'cv-btn-primary')}
      style={Object.assign({ padding: '12px 24px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }, style || {})}
      onClick={onClick}
      disabled={loading || disabled}
    >
      {loading && <div className="cv-spinner cv-spinner-sm" style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#fff' }} />}
      {children}
    </button>
  );
}


// ═══════════════════════════════════════════════════════════════
// CONFIRMATION DIALOG
// ═══════════════════════════════════════════════════════════════

export function ConfirmDialog({ open, title, message, onConfirm, onCancel, confirmText, danger }) {
  if (!open) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9998, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div onClick={onCancel} style={{ position: 'absolute', inset: 0, background: 'rgba(11,37,69,0.4)', backdropFilter: 'blur(4px)' }} />
      <div style={{ position: 'relative', background: '#fff', borderRadius: 20, padding: '28px 28px 22px', maxWidth: 400, width: '100%', boxShadow: '0 20px 60px rgba(11,37,69,0.15)', animation: 'cv-fadeInScale 0.25s ease-out' }}>
        <h3 style={{ fontSize: 17, fontWeight: 700, color: C.navy, margin: '0 0 8px' }}>{title || 'Are you sure?'}</h3>
        <p style={{ fontSize: 13, color: 'rgba(11,37,69,0.55)', margin: '0 0 22px', lineHeight: 1.5 }}>{message || 'This action cannot be undone.'}</p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={onCancel} className="cv-btn cv-btn-outline" style={{ padding: '10px 20px', fontSize: 13 }}>Cancel</button>
          <button onClick={onConfirm} className="cv-btn" style={{
            padding: '10px 22px', fontSize: 13,
            background: danger ? 'linear-gradient(135deg, #dc2626, #b91c1c)' : 'linear-gradient(135deg, ' + C.gold + ', ' + C.darkGold + ')',
            color: '#fff',
          }}>
            {confirmText || 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════
// ANIMATED COUNTER — Numbers count up on mount
// ═══════════════════════════════════════════════════════════════

export function AnimatedCounter({ value, duration }) {
  var [display, setDisplay] = useState(0);
  
  useEffect(function() {
    var start = 0;
    var end = parseInt(value) || 0;
    if (end === 0) { setDisplay(0); return; }
    var dur = duration || 800;
    var startTime = null;
    
    function step(timestamp) {
      if (!startTime) startTime = timestamp;
      var progress = Math.min((timestamp - startTime) / dur, 1);
      var eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
      setDisplay(Math.floor(eased * end));
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }, [value, duration]);
  
  return display;
}


// ═══════════════════════════════════════════════════════════════
// PROGRESS RING — Circular progress indicator
// ═══════════════════════════════════════════════════════════════

export function ProgressRing({ progress, size, strokeWidth, color }) {
  size = size || 48;
  strokeWidth = strokeWidth || 4;
  var radius = (size - strokeWidth) / 2;
  var circumference = 2 * Math.PI * radius;
  var offset = circumference - (progress / 100) * circumference;
  
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="rgba(11,37,69,0.06)" strokeWidth={strokeWidth} />
      <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke={color || C.gold} strokeWidth={strokeWidth}
        strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.8s ease' }} />
    </svg>
  );
}

