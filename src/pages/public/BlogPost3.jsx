import { useNavigate } from 'react-router-dom';
import CanonicalUrl from '../../components/CanonicalUrl';

const C = { navy: '#0B2545', gold: '#C5960C', goldL: '#F0B429', warm: '#FAF8F5' };
const T = { serif: "'Libre Baskerville', Georgia, serif", sans: "'DM Sans', system-ui, sans-serif" };

function BlogLayout({ children, title, category, date, readTime, canonicalPath }) {
  const navigate = useNavigate();
  return (
    <div style={{ fontFamily: T.sans, background: C.warm, minHeight: '100vh' }}>
      <CanonicalUrl path={canonicalPath} />
      <nav style={{ background: C.navy, padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span onClick={() => navigate('/')} style={{ fontFamily: T.serif, fontSize: 20, fontWeight: 700, color: '#fff', cursor: 'pointer' }}>
          <span style={{ color: C.goldL }}>Civic</span>Verify
        </span>
        <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
          <span onClick={() => navigate('/blog')} style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.7)', cursor: 'pointer' }}>Blog</span>
          <button onClick={() => navigate('/signup')} style={{ fontSize: 13, fontWeight: 700, color: C.navy, background: C.goldL, border: 'none', borderRadius: 8, padding: '8px 18px', cursor: 'pointer' }}>Sign Up</button>
        </div>
      </nav>
      <div style={{ background: `linear-gradient(135deg, ${C.navy}, #112d4e)`, padding: '56px 24px 48px', textAlign: 'center' }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: C.goldL, textTransform: 'uppercase', letterSpacing: 2, background: 'rgba(240,180,41,0.1)', padding: '4px 12px', borderRadius: 6 }}>{category}</span>
        <h1 style={{ fontFamily: T.serif, fontSize: 'clamp(24px, 5vw, 36px)', fontWeight: 700, color: '#fff', margin: '20px auto 16px', maxWidth: 700, lineHeight: 1.3 }}>{title}</h1>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>{date} · {readTime}</p>
      </div>
      <article style={{ maxWidth: 720, margin: '0 auto', padding: '48px 24px 64px' }}>{children}</article>
      <div style={{ background: C.navy, padding: '48px 24px', textAlign: 'center' }}>
        <button onClick={() => navigate('/blog')} style={{ fontSize: 14, fontWeight: 600, color: C.goldL, background: 'none', border: `1px solid ${C.goldL}`, borderRadius: 10, padding: '10px 28px', cursor: 'pointer', marginBottom: 20 }}>← All Articles</button>
        <h3 style={{ fontFamily: T.serif, fontSize: 22, color: '#fff', margin: '0 0 10px' }}>Indianapolis, This Is For You</h3>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', margin: '0 0 20px' }}>Your verified voice matters. Make it count.</p>
        <button onClick={() => navigate('/signup')} style={{ fontSize: 15, fontWeight: 700, color: C.navy, background: C.goldL, border: 'none', borderRadius: 10, padding: '14px 36px', cursor: 'pointer' }}>Sign Up Free</button>
      </div>
      <footer style={{ background: '#071b33', padding: '32px 24px', textAlign: 'center' }}>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', margin: 0 }}>© 2026 CivicVerify · <span style={{ cursor: 'pointer' }} onClick={() => navigate('/privacy')}>Privacy</span> · <span style={{ cursor: 'pointer' }} onClick={() => navigate('/terms')}>Terms</span></p>
      </footer>
    </div>
  );
}

const h2Style = { fontFamily: "'Libre Baskerville', Georgia, serif", fontSize: 22, fontWeight: 700, color: '#0B2545', margin: '40px 0 16px', lineHeight: 1.35 };
const pStyle = { fontSize: 15.5, color: 'rgba(11,37,69,0.72)', lineHeight: 1.8, margin: '0 0 20px' };
const pullStyle = { fontFamily: "'Libre Baskerville', Georgia, serif", fontSize: 18, fontWeight: 600, color: '#0B2545', borderLeft: '3px solid #F0B429', paddingLeft: 20, margin: '32px 0', lineHeight: 1.55, fontStyle: 'italic' };

export default function BlogPost3() {
  return (
    <BlogLayout
      title="Civic Engagement in Indianapolis: Why Your Voice Gets Drowned Out"
      category="Civic Engagement"
      date="March 2, 2026"
      readTime="7 min read"
      canonicalPath="/blog/civic-engagement-indianapolis"
    >
      <p style={pStyle}>
        Indianapolis is the 16th largest city in the United States. Nearly 900,000 people live within its consolidated city-county boundaries. It has a mayor, a 25-member city-county council, dozens of neighbourhood associations, and a complex web of agencies responsible for everything from transit to public safety to park maintenance. And yet, when these institutions need to know what residents actually think, the feedback mechanisms available to them are remarkably primitive.
      </p>

      <h2 style={h2Style}>The Public Comment Problem</h2>
      <p style={pStyle}>
        The primary tool for civic feedback in Indianapolis — as in most American cities — is the public comment period. A proposed zoning change, a transit route adjustment, a new park development: each of these goes through a process that includes, at some point, an opportunity for "public input." In practice, this means a meeting room at 6 PM on a Tuesday where a handful of residents speak for three minutes each, or an open email inbox that collects responses with no way to verify who sent them.
      </p>
      <p style={pStyle}>
        The result is predictable. The people who show up to public comment meetings are disproportionately older, wealthier, and more likely to be opposed to change. Working parents, shift workers, renters, young professionals, and people without reliable transportation are systematically excluded — not by design, but by the practical barriers of showing up in person at a specific time and place.
      </p>

      <div style={pullStyle}>
        "The loudest voices at a Tuesday evening meeting are not the same as the most representative voices. Indianapolis deserves better than that."
      </div>

      <h2 style={h2Style}>Digital Feedback Is Not the Answer — Yet</h2>
      <p style={pStyle}>
        Some Indianapolis agencies have experimented with digital engagement: online surveys, social media polls, community forums. These tools remove the in-person barrier, which is genuine progress. But they introduce a new problem: without identity verification, there is no way to know whether responses are coming from actual Indianapolis residents, from bots, from duplicate submissions, or from organised interest groups flooding the results.
      </p>
      <p style={pStyle}>
        A SurveyMonkey link shared on a neighbourhood Facebook group is better than nothing. But it does not produce data that any serious decision-maker can trust, because anyone with the link can respond — whether they live in the neighbourhood, the city, or another country entirely.
      </p>

      <h2 style={h2Style}>What Indianapolis Residents Actually Want</h2>
      <p style={pStyle}>
        Conversations with Indianapolis community leaders and residents reveal a consistent set of frustrations. People want to participate in civic decisions, but they feel like the system is not designed for them. Specifically:
      </p>
      <p style={{ ...pStyle, paddingLeft: 24 }}>
        <strong>They want convenience.</strong> Participation should not require taking time off work, finding childcare, or driving across town. A mobile-friendly, accessible tool that works from anywhere is not a luxury — it is a prerequisite for genuine inclusivity.<br /><br />
        <strong>They want to know their input matters.</strong> Many residents have participated in public comment processes and seen zero evidence that their feedback influenced anything. Transparent reporting on how poll results are used would transform willingness to participate.<br /><br />
        <strong>They want protection from manipulation.</strong> Residents are aware that online polls can be gamed. They want to know that when they take the time to share their honest opinion, it will not be drowned out by fake responses or organised brigading.
      </p>

      <h2 style={h2Style}>A Verified Civic Engagement Model</h2>
      <p style={pStyle}>
        Imagine a different model for Indianapolis civic feedback. Instead of a public comment meeting or an unverified online survey, a city agency posts a poll on a platform where every respondent has been identity-verified as a real person. The poll is accessible from any smartphone. Respondents can share their opinions in two minutes, from their couch, at 10 PM, after putting their kids to bed.
      </p>
      <p style={pStyle}>
        The results come back with demographic data attached — not individual names, but aggregate information about who responded: age ranges, neighbourhoods, backgrounds. The agency knows that every response is from a unique, verified individual. They can see whether the results skew toward one demographic or genuinely represent a cross-section of the community. And they can publish the results openly, because the methodology is defensible.
      </p>
      <p style={pStyle}>
        This is what CivicVerify was built to enable. Not as a replacement for public meetings — those serve important democratic functions — but as a complement that extends participation to the hundreds of thousands of Indianapolis residents who currently have no practical way to be heard.
      </p>

      <h2 style={h2Style}>Why Indianapolis Is the Right Place to Start</h2>
      <p style={pStyle}>
        Indianapolis has characteristics that make it an ideal proving ground for verified civic engagement. It is large enough to face the scale challenges that make traditional public comment inadequate, but compact enough — as a consolidated city-county — that a single platform can serve the entire metropolitan governance structure. It has an active civic ecosystem with organisations like the Indy Chamber, Keep Indianapolis Beautiful, and dozens of neighbourhood associations that already work to bridge the gap between residents and government.
      </p>
      <p style={pStyle}>
        Most importantly, Indianapolis has residents who care. The city's volunteer rates, community organisation participation, and local election engagement all demonstrate that people want to be involved. The barrier is not apathy — it is access.
      </p>

      <h2 style={h2Style}>What Comes Next</h2>
      <p style={pStyle}>
        CivicVerify is currently inviting Indianapolis civic organisations — government agencies, nonprofits, neighbourhood associations, and community groups — to pilot the platform. The offer is straightforward: create a survey on any topic that matters to your community, distribute it to verified residents, and receive authentic, demographic-rich results at no cost during the pilot period.
      </p>
      <p style={pStyle}>
        For residents, participation starts with a free account and a one-time identity verification. After that, every poll and survey on the platform is accessible, and every response carries the weight of a verified, real human voice.
      </p>
      <p style={pStyle}>
        Indianapolis has nearly a million voices. It is time to start hearing all of them.
      </p>

      <div style={{ background: 'rgba(197,150,12,0.06)', border: '1px solid rgba(197,150,12,0.15)', borderRadius: 12, padding: 24, marginTop: 40 }}>
        <p style={{ fontSize: 14, fontWeight: 700, color: C.navy, margin: '0 0 8px' }}>Key Takeaway</p>
        <p style={{ fontSize: 14, color: 'rgba(11,37,69,0.6)', margin: 0, lineHeight: 1.65 }}>
          Indianapolis residents want to participate in civic decisions but are held back by outdated feedback methods. Public comment meetings exclude working families, and unverified online polls cannot be trusted. Verified civic engagement — where every respondent is confirmed as a real, unique person — offers a way to hear from all 900,000 residents, not just the loudest few.
        </p>
      </div>
    </BlogLayout>
  );
}
