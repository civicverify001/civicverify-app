import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';

const C = { navy: '#0B2545', gold: '#C5960C', goldL: '#F0B429', green: '#16a34a', red: '#dc2626' };
const T = { serif: "'Libre Baskerville', Georgia, serif", sans: "'DM Sans', system-ui, sans-serif" };

function generateSlug(title) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80);
}

export default function AdminBlog() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // null = list view, object = editor
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState('all'); // all, published, draft

  useEffect(() => { fetchPosts(); }, []);

  async function fetchPosts() {
    setLoading(true);
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error) setPosts(data || []);
    setLoading(false);
  }

  function newPost() {
    setEditing({
      id: null,
      title: '',
      slug: '',
      excerpt: '',
      content: '',
      category: 'General',
      status: 'draft',
      author_name: 'CivicVerify Team',
      read_time: '5 min read',
      meta_keywords: '',
    });
  }

  function editPost(post) {
    setEditing({ ...post });
  }

  async function savePost() {
    if (!editing.title.trim() || !editing.content.trim()) {
      alert('Title and content are required.');
      return;
    }
    setSaving(true);
    const slug = editing.slug || generateSlug(editing.title);
    const payload = {
      title: editing.title,
      slug,
      excerpt: editing.excerpt,
      content: editing.content,
      category: editing.category,
      status: editing.status,
      author_name: editing.author_name,
      read_time: editing.read_time,
      meta_keywords: editing.meta_keywords,
    };

    let error;
    if (editing.id) {
      ({ error } = await supabase.from('blog_posts').update(payload).eq('id', editing.id));
    } else {
      ({ error } = await supabase.from('blog_posts').insert(payload));
    }

    setSaving(false);
    if (error) {
      alert('Error saving: ' + error.message);
    } else {
      setEditing(null);
      fetchPosts();
    }
  }

  async function deletePost(id) {
    if (!window.confirm('Permanently delete this post?')) return;
    await supabase.from('blog_posts').delete().eq('id', id);
    fetchPosts();
  }

  async function toggleStatus(post) {
    const newStatus = post.status === 'published' ? 'draft' : 'published';
    await supabase.from('blog_posts').update({ status: newStatus }).eq('id', post.id);
    fetchPosts();
  }

  const filtered = tab === 'all' ? posts : posts.filter(p => p.status === tab);

  const inputStyle = {
    width: '100%', padding: '10px 14px', borderRadius: 10,
    border: '1px solid rgba(11,37,69,0.1)', fontSize: 14,
    fontFamily: T.sans, outline: 'none', background: '#fff',
  };

  // ── EDITOR VIEW ──
  if (editing) {
    return (
      <div style={{ fontFamily: T.sans, maxWidth: 860 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
          <div>
            <button onClick={() => setEditing(null)} style={{ fontSize: 13, color: C.gold, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, marginBottom: 8, display: 'block' }}>
              ← Back to Posts
            </button>
            <h1 style={{ fontFamily: T.serif, fontSize: 24, fontWeight: 700, color: C.navy, margin: 0 }}>
              {editing.id ? 'Edit Post' : 'New Blog Post'}
            </h1>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => { setEditing({ ...editing, status: 'draft' }); setTimeout(savePost, 50); }}
              style={{ padding: '10px 20px', borderRadius: 10, border: '1px solid rgba(11,37,69,0.1)', background: '#fff', color: C.navy, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              Save Draft
            </button>
            <button onClick={() => { setEditing({ ...editing, status: 'published' }); setTimeout(savePost, 50); }}
              style={{ padding: '10px 24px', borderRadius: 10, border: 'none', background: C.gold, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
              {saving ? 'Saving...' : 'Publish'}
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Title */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: C.navy, textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 6 }}>Title</label>
            <input style={{ ...inputStyle, fontSize: 18, fontWeight: 600 }} value={editing.title}
              onChange={e => setEditing({ ...editing, title: e.target.value, slug: editing.id ? editing.slug : generateSlug(e.target.value) })}
              placeholder="Your blog post title" />
          </div>

          {/* Slug */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: C.navy, textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 6 }}>URL Slug</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 13, color: 'rgba(11,37,69,0.35)' }}>civicverify.org/blog/</span>
              <input style={{ ...inputStyle, flex: 1 }} value={editing.slug}
                onChange={e => setEditing({ ...editing, slug: e.target.value })}
                placeholder="auto-generated-from-title" />
            </div>
          </div>

          {/* Row: Category + Read Time + Author */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: C.navy, textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 6 }}>Category</label>
              <select style={inputStyle} value={editing.category}
                onChange={e => setEditing({ ...editing, category: e.target.value })}>
                {['General', 'Trust & Verification', 'Privacy & Security', 'Civic Engagement', 'Platform Updates', 'Indianapolis'].map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: C.navy, textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 6 }}>Read Time</label>
              <input style={inputStyle} value={editing.read_time}
                onChange={e => setEditing({ ...editing, read_time: e.target.value })}
                placeholder="5 min read" />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: C.navy, textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 6 }}>Author</label>
              <input style={inputStyle} value={editing.author_name}
                onChange={e => setEditing({ ...editing, author_name: e.target.value })}
                placeholder="CivicVerify Team" />
            </div>
          </div>

          {/* SEO Keywords */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: C.navy, textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 6 }}>SEO Keywords</label>
            <input style={inputStyle} value={editing.meta_keywords}
              onChange={e => setEditing({ ...editing, meta_keywords: e.target.value })}
              placeholder="verified civic polls, bot-free polling, authentic feedback" />
          </div>

          {/* Excerpt */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: C.navy, textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 6 }}>Excerpt (shown on blog listing)</label>
            <textarea style={{ ...inputStyle, minHeight: 70, resize: 'vertical' }} value={editing.excerpt}
              onChange={e => setEditing({ ...editing, excerpt: e.target.value })}
              placeholder="A short summary that appears on the blog index page..." />
          </div>

          {/* Content */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: C.navy, textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 6 }}>
              Content
              <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, marginLeft: 8, color: 'rgba(11,37,69,0.35)', fontSize: 11 }}>
                Supports: ## Heading, **bold**, &gt; blockquote, blank line = paragraph break
              </span>
            </label>
            <textarea style={{ ...inputStyle, minHeight: 400, resize: 'vertical', fontFamily: 'monospace', fontSize: 13, lineHeight: 1.7 }}
              value={editing.content}
              onChange={e => setEditing({ ...editing, content: e.target.value })}
              placeholder="Write your blog post content here...

## Use headings like this

Regular paragraphs separated by blank lines.

**Bold text** for emphasis.

> Blockquotes for pull quotes" />
          </div>

          {/* Bottom save bar */}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 8, borderTop: '1px solid rgba(11,37,69,0.06)' }}>
            <button onClick={() => setEditing(null)}
              style={{ padding: '10px 24px', borderRadius: 10, border: '1px solid rgba(11,37,69,0.1)', background: '#fff', color: C.navy, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              Cancel
            </button>
            <button onClick={savePost}
              style={{ padding: '10px 28px', borderRadius: 10, border: 'none', background: C.gold, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
              {saving ? 'Saving...' : (editing.id ? 'Update Post' : 'Create Post')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── LIST VIEW ──
  return (
    <div style={{ fontFamily: T.sans, maxWidth: 920 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontFamily: T.serif, fontSize: 28, fontWeight: 700, color: C.navy, margin: '0 0 4px' }}>Blog Posts</h1>
          <p style={{ fontSize: 13, color: 'rgba(11,37,69,0.4)', margin: 0 }}>Create and manage SEO blog content</p>
        </div>
        <button onClick={newPost}
          style={{ padding: '10px 24px', borderRadius: 10, border: 'none', background: C.gold, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
          ✏️ New Post
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: 'rgba(11,37,69,0.03)', borderRadius: 10, padding: 3 }}>
        {[
          { key: 'all', label: 'All', count: posts.length },
          { key: 'published', label: 'Published', count: posts.filter(p => p.status === 'published').length },
          { key: 'draft', label: 'Drafts', count: posts.filter(p => p.status === 'draft').length },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            style={{
              flex: 1, padding: '8px 16px', borderRadius: 8, border: 'none',
              background: tab === t.key ? '#fff' : 'transparent',
              boxShadow: tab === t.key ? '0 1px 4px rgba(11,37,69,0.08)' : 'none',
              color: tab === t.key ? C.navy : 'rgba(11,37,69,0.4)',
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}>
            {t.label} ({t.count})
          </button>
        ))}
      </div>

      {/* Posts list */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'rgba(11,37,69,0.3)' }}>Loading...</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, background: '#fff', borderRadius: 16, border: '1px solid rgba(11,37,69,0.06)' }}>
          <p style={{ fontSize: 16, color: 'rgba(11,37,69,0.3)', marginBottom: 16 }}>No posts yet</p>
          <button onClick={newPost} style={{ fontSize: 14, fontWeight: 600, color: C.gold, background: 'none', border: 'none', cursor: 'pointer' }}>
            Create your first post →
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map(post => (
            <div key={post.id} style={{
              background: '#fff', borderRadius: 14, border: '1px solid rgba(11,37,69,0.06)',
              padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 16,
            }}>
              {/* Status dot */}
              <div style={{
                width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
                background: post.status === 'published' ? C.green : '#f59e0b',
              }} />

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: C.navy, margin: '0 0 4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {post.title}
                </h3>
                <div style={{ display: 'flex', gap: 12, fontSize: 12, color: 'rgba(11,37,69,0.35)' }}>
                  <span>{post.category}</span>
                  <span>·</span>
                  <span>{post.read_time}</span>
                  <span>·</span>
                  <span>{new Date(post.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  <span>·</span>
                  <span style={{ color: post.status === 'published' ? C.green : '#f59e0b', fontWeight: 600 }}>
                    {post.status === 'published' ? '● Published' : '○ Draft'}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                <button onClick={() => toggleStatus(post)}
                  style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid rgba(11,37,69,0.08)', background: '#fff', fontSize: 12, fontWeight: 600, color: C.navy, cursor: 'pointer' }}>
                  {post.status === 'published' ? 'Unpublish' : 'Publish'}
                </button>
                <button onClick={() => editPost(post)}
                  style={{ padding: '6px 14px', borderRadius: 8, border: 'none', background: 'rgba(197,150,12,0.1)', fontSize: 12, fontWeight: 600, color: C.gold, cursor: 'pointer' }}>
                  Edit
                </button>
                <button onClick={() => deletePost(post.id)}
                  style={{ padding: '6px 14px', borderRadius: 8, border: 'none', background: 'rgba(220,38,38,0.06)', fontSize: 12, fontWeight: 600, color: C.red, cursor: 'pointer' }}>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
