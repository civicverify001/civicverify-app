import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';

const C = { navy: '#0B2545', gold: '#C5960C', goldL: '#F0B429', green: '#16a34a', red: '#dc2626' };
const T = { serif: "'Libre Baskerville', Georgia, serif", sans: "'DM Sans', system-ui, sans-serif" };

function timeAgo(ts) {
  var s = Math.floor((Date.now() - new Date(ts)) / 1000);
  if (s < 3600) return Math.floor(s / 60) + 'm ago';
  if (s < 86400) return Math.floor(s / 3600) + 'h ago';
  return Math.floor(s / 86400) + 'd ago';
}

export default function AdminDebates() {
  var [debates, setDebates] = useState([]);
  var [loading, setLoading] = useState(true);
  var [error, setError] = useState(null);
  var [editing, setEditing] = useState(null);
  var [saving, setSaving] = useState(false);
  var [tab, setTab] = useState('all');

  useEffect(function() { fetchDebates(); }, []);

  async function fetchDebates() {
    setLoading(true);
    setError(null);
    var { data, error: err } = await supabase
      .from('debates')
      .select('*')
      .order('created_at', { ascending: false });
    if (err) {
      setError(err.message);
      setLoading(false);
      return;
    }
    setDebates(data || []);
    setLoading(false);
  }

  function newDebate() {
    setEditing({
      id: null,
      topic: '',
      description: '',
      side_a_label: 'For',
      side_b_label: 'Against',
      category: 'General',
      status: 'active',
    });
  }

  function editDebate(d) {
    setEditing({ ...d });
  }

  async function saveDebate() {
    if (!editing.topic.trim()) { alert('Topic is required.'); return; }
    setSaving(true);

    var payload = {
      topic: editing.topic,
      description: editing.description || '',
      side_a_label: editing.side_a_label || 'For',
      side_b_label: editing.side_b_label || 'Against',
      category: editing.category || 'General',
      status: editing.status || 'active',
    };

    var err;
    if (editing.id) {
      ({ error: err } = await supabase.from('debates').update(payload).eq('id', editing.id));
    } else {
      // Get current user for created_by
      var { data: { user } } = await supabase.auth.getUser();
      payload.created_by = user?.id;
      ({ error: err } = await supabase.from('debates').insert(payload));
    }

    setSaving(false);
    if (err) {
      alert('Error: ' + err.message);
    } else {
      setEditing(null);
      fetchDebates();
    }
  }

  async function deleteDebate(id) {
    if (!window.confirm('Delete this debate and all its arguments? This cannot be undone.')) return;
    // Try to delete arguments first
    await supabase.from('debate_arguments').delete().eq('debate_id', id);
    await supabase.from('debates').delete().eq('id', id);
    fetchDebates();
  }

  async function toggleStatus(debate) {
    var newStatus = debate.status === 'active' ? 'closed' : 'active';
    await supabase.from('debates').update({ status: newStatus }).eq('id', debate.id);
    fetchDebates();
  }

  var filtered = tab === 'all' ? debates : debates.filter(function(d) { return d.status === tab; });
  var inputStyle = { width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid rgba(11,37,69,0.1)', fontSize: 14, fontFamily: T.sans, outline: 'none', background: '#fff', boxSizing: 'border-box' };

  // Table doesn't exist yet
  if (error && (error.includes('does not exist') || error.includes('relation'))) {
    return (
      <div style={{ fontFamily: T.sans, maxWidth: 800 }}>
        <h1 style={{ fontFamily: T.serif, fontSize: 28, fontWeight: 700, color: C.navy, margin: '0 0 8px' }}>Debates</h1>
        <p style={{ fontSize: 13, color: 'rgba(11,37,69,0.4)', margin: '0 0 24px' }}>Manage citizen debates and discussions</p>

        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid rgba(197,150,12,0.2)', padding: '28px 24px' }}>
          <p style={{ fontSize: 15, fontWeight: 700, color: C.navy, margin: '0 0 12px' }}>⚠️ Database setup required</p>
          <p style={{ fontSize: 13, color: 'rgba(11,37,69,0.5)', margin: '0 0 16px', lineHeight: 1.6 }}>
            Run this SQL in your Supabase SQL Editor to create the debates table:
          </p>
          <pre style={{ background: 'rgba(11,37,69,0.03)', border: '1px solid rgba(11,37,69,0.08)', borderRadius: 10, padding: '16px', fontSize: 12, color: C.navy, overflowX: 'auto', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
{`-- Debates table
CREATE TABLE IF NOT EXISTS debates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  topic TEXT NOT NULL,
  description TEXT DEFAULT '',
  side_a_label TEXT DEFAULT 'For',
  side_b_label TEXT DEFAULT 'Against',
  category TEXT DEFAULT 'General',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'closed')),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Debate arguments
CREATE TABLE IF NOT EXISTS debate_arguments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  debate_id UUID REFERENCES debates(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  side TEXT NOT NULL CHECK (side IN ('a', 'b')),
  content TEXT NOT NULL,
  likes_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE debates ENABLE ROW LEVEL SECURITY;
ALTER TABLE debate_arguments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "read debates" ON debates FOR SELECT USING (true);
CREATE POLICY "admin manage debates" ON debates FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
);
CREATE POLICY "read arguments" ON debate_arguments FOR SELECT USING (true);
CREATE POLICY "insert argument" ON debate_arguments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "admin manage arguments" ON debate_arguments FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_debates_status ON debates(status);
CREATE INDEX IF NOT EXISTS idx_debate_args_debate ON debate_arguments(debate_id);`}
          </pre>
          <p style={{ fontSize: 12, color: 'rgba(11,37,69,0.35)', margin: '16px 0 0' }}>After running the SQL, refresh this page.</p>
        </div>
      </div>
    );
  }

  // ── EDITOR ──
  if (editing) {
    return (
      <div style={{ fontFamily: T.sans, maxWidth: 700 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <button onClick={function() { setEditing(null); }} style={{ fontSize: 13, color: C.gold, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, marginBottom: 6, display: 'block' }}>← Back to Debates</button>
            <h1 style={{ fontFamily: T.serif, fontSize: 24, fontWeight: 700, color: C.navy, margin: 0 }}>{editing.id ? 'Edit Debate' : 'New Debate'}</h1>
          </div>
          <button onClick={saveDebate} style={{ padding: '10px 24px', borderRadius: 10, border: 'none', background: C.gold, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
            {saving ? 'Saving...' : (editing.id ? 'Update' : 'Create Debate')}
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: C.navy, textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 6 }}>Topic / Question</label>
            <input style={{ ...inputStyle, fontSize: 16, fontWeight: 600 }} value={editing.topic}
              onChange={function(e) { setEditing({ ...editing, topic: e.target.value }); }}
              placeholder="Should the city invest in more public transit?" />
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: C.navy, textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 6 }}>Description</label>
            <textarea style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }} value={editing.description}
              onChange={function(e) { setEditing({ ...editing, description: e.target.value }); }}
              placeholder="Additional context for the debate..." />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: C.navy, textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 6 }}>Side A Label</label>
              <input style={inputStyle} value={editing.side_a_label}
                onChange={function(e) { setEditing({ ...editing, side_a_label: e.target.value }); }}
                placeholder="For" />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: C.navy, textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 6 }}>Side B Label</label>
              <input style={inputStyle} value={editing.side_b_label}
                onChange={function(e) { setEditing({ ...editing, side_b_label: e.target.value }); }}
                placeholder="Against" />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: C.navy, textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 6 }}>Category</label>
              <select style={inputStyle} value={editing.category}
                onChange={function(e) { setEditing({ ...editing, category: e.target.value }); }}>
                {['General', 'Local Government', 'Education', 'Healthcare', 'Public Transit', 'Housing', 'Climate', 'Economy', 'Public Safety'].map(function(c) {
                  return <option key={c} value={c}>{c}</option>;
                })}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: C.navy, textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 6 }}>Status</label>
              <select style={inputStyle} value={editing.status}
                onChange={function(e) { setEditing({ ...editing, status: e.target.value }); }}>
                <option value="active">Active</option>
                <option value="closed">Closed</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── LIST VIEW ──
  return (
    <div style={{ fontFamily: T.sans, maxWidth: 920 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: T.serif, fontSize: 28, fontWeight: 700, color: C.navy, margin: '0 0 4px' }}>Debates</h1>
          <p style={{ fontSize: 13, color: 'rgba(11,37,69,0.4)', margin: 0 }}>Create and manage civic debates</p>
        </div>
        <button onClick={newDebate}
          style={{ padding: '10px 24px', borderRadius: 10, border: 'none', background: C.gold, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
          ⚔️ New Debate
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: 'rgba(11,37,69,0.03)', borderRadius: 10, padding: 3 }}>
        {[
          { key: 'all', label: 'All', count: debates.length },
          { key: 'active', label: 'Active', count: debates.filter(function(d) { return d.status === 'active'; }).length },
          { key: 'closed', label: 'Closed', count: debates.filter(function(d) { return d.status === 'closed'; }).length },
        ].map(function(t) {
          return (
            <button key={t.key} onClick={function() { setTab(t.key); }}
              style={{
                flex: 1, padding: '8px 16px', borderRadius: 8, border: 'none',
                background: tab === t.key ? '#fff' : 'transparent',
                boxShadow: tab === t.key ? '0 1px 4px rgba(11,37,69,0.08)' : 'none',
                color: tab === t.key ? C.navy : 'rgba(11,37,69,0.4)',
                fontSize: 13, fontWeight: 600, cursor: 'pointer',
              }}>
              {t.label} ({t.count})
            </button>
          );
        })}
      </div>

      {/* List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'rgba(11,37,69,0.3)' }}>Loading...</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, background: '#fff', borderRadius: 16, border: '1px solid rgba(11,37,69,0.06)' }}>
          <p style={{ fontSize: 16, color: 'rgba(11,37,69,0.3)', marginBottom: 16 }}>No debates yet</p>
          <button onClick={newDebate} style={{ fontSize: 14, fontWeight: 600, color: C.gold, background: 'none', border: 'none', cursor: 'pointer' }}>
            Create your first debate →
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map(function(debate) {
            return (
              <div key={debate.id} style={{
                background: '#fff', borderRadius: 14, border: '1px solid rgba(11,37,69,0.06)',
                padding: '20px 24px',
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                  {/* Status dot */}
                  <div style={{ width: 10, height: 10, borderRadius: '50%', flexShrink: 0, marginTop: 6, background: debate.status === 'active' ? C.green : '#94a3b8' }} />

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: C.navy, margin: '0 0 6px' }}>{debate.topic}</h3>
                    {debate.description && (
                      <p style={{ fontSize: 13, color: 'rgba(11,37,69,0.45)', margin: '0 0 8px', lineHeight: 1.5 }}>{debate.description}</p>
                    )}
                    <div style={{ display: 'flex', gap: 12, fontSize: 12, color: 'rgba(11,37,69,0.35)', flexWrap: 'wrap' }}>
                      <span style={{ background: 'rgba(11,37,69,0.04)', padding: '2px 8px', borderRadius: 6 }}>{debate.category}</span>
                      <span>🟢 {debate.side_a_label} vs 🔴 {debate.side_b_label}</span>
                      <span>{timeAgo(debate.created_at)}</span>
                      {debate.creator?.full_name && <span>by {debate.creator.full_name}</span>}
                      <span style={{ color: debate.status === 'active' ? C.green : '#94a3b8', fontWeight: 600 }}>
                        {debate.status === 'active' ? '● Active' : '○ Closed'}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                    <button onClick={function() { toggleStatus(debate); }}
                      style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid rgba(11,37,69,0.08)', background: '#fff', fontSize: 12, fontWeight: 600, color: C.navy, cursor: 'pointer' }}>
                      {debate.status === 'active' ? 'Close' : 'Reopen'}
                    </button>
                    <button onClick={function() { editDebate(debate); }}
                      style={{ padding: '6px 14px', borderRadius: 8, border: 'none', background: 'rgba(197,150,12,0.1)', fontSize: 12, fontWeight: 600, color: C.gold, cursor: 'pointer' }}>
                      Edit
                    </button>
                    <button onClick={function() { deleteDebate(debate.id); }}
                      style={{ padding: '6px 14px', borderRadius: 8, border: 'none', background: 'rgba(220,38,38,0.06)', fontSize: 12, fontWeight: 600, color: C.red, cursor: 'pointer' }}>
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
