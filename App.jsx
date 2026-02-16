import { useState, useEffect } from "react";

/* ===== THEME ===== */
const T = {
  navy: "#0B2545",
  red: "#BF2A2A",
  gold: "#C5960C",
  dark: "#1A1614",
  gray: "#6B6560",
  light: "#F7F9FB",
  green: "#1B7A3D",
  bone: "#E4E0DC",
  cream: "#FAFAF7",
};

/* ===== CSS ===== */
const globalCSS = `
*{margin:0;padding:0;box-sizing:border-box}
body,button,input,select,textarea{font-family:'DM Sans',Helvetica,sans-serif}
table{width:100%;border-collapse:collapse}
th,td{padding:8px 10px;text-align:left;border-bottom:1px solid #eee;font-size:13px}
th{font-weight:700;color:${T.navy};font-size:11px;text-transform:uppercase;letter-spacing:.5px}
.card{background:#fff;border-radius:14px;box-shadow:0 1px 4px #0001;border:1px solid #f0ece8}
.btn{padding:10px 20px;border-radius:10px;font-weight:700;font-size:13px;cursor:pointer;border:none;transition:all .2s}
.btn-r{background:${T.red};color:#fff}
.btn-r:hover{background:#a02020}
.btn-g{background:${T.gold};color:#fff}
.btn-o{background:transparent;border:2px solid}
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Libre+Baskerville:wght@400;700&display=swap');
`;

/* ===== HOOK ===== */
function useIsMobile() {
  const [mobile, setMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handler = () => setMobile(window.innerWidth < 768);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return mobile;
}

/* ===== ICONS ===== */
function Shield({ size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <path d="M24 4L6 12V22C6 33.1 13.6 43.2 24 46C34.4 43.2 42 33.1 42 22V12L24 4Z" fill={T.navy} stroke={T.gold} strokeWidth="1.5" />
      <path d="M20 24L23 27L28 20" stroke={T.gold} strokeWidth="2" fill="none" />
    </svg>
  );
}

function Badge({ text, color }) {
  const colors = { green: T.green, red: T.red, gold: T.gold, gray: T.gray };
  const c = colors[color] || T.gray;
  return (
    <span style={{ background: c + "18", color: c, padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700 }}>
      {text}
    </span>
  );
}

/* ===== DEMO DATA ===== */
const STATES = ["IN","OH","IL","MI","CA","TX","FL","NY","PA","GA"];
const PARTIES = ["Democrat","Republican","Independent","Libertarian","Green"];
const NAMES = ["Sarah Chen","Marcus Williams","Priya Patel","James O'Brien","Maria Garcia","David Kim","Aisha Johnson","Robert Taylor","Elena Volkov","Thomas Wright"];

function makeRespondents() {
  const arr = [];
  for (let i = 0; i < 26; i++) {
    arr.push({
      id: i + 1,
      name: NAMES[i % 10],
      email: "user" + (i+1) + "@mail.com",
      vf: i < 20,
      st: STATES[i % 10],
      age: 22 + (i * 3) % 40,
      party: PARTIES[i % 5],
      dt: "2025-0" + (1 + i % 3) + "-" + String(10 + i % 18).padStart(2, "0"),
    });
  }
  return arr;
}

const DATA = {
  respondents: makeRespondents(),
  surveys: [
    { id: 1, title: "Healthcare Priority Index", client: "IN Health Policy", st: "active", n: 847, type: "5Q", price: 3.50 },
    { id: 2, title: "Education Funding Pulse", client: "EduFirst PAC", st: "active", n: 623, type: "10Q", price: 5.00 },
    { id: 3, title: "Infrastructure Satisfaction", client: "BuildAmerica", st: "completed", n: 1205, type: "5Q", price: 3.50 },
    { id: 4, title: "Tax Reform Sentiment", client: "FairTax Coalition", st: "active", n: 412, type: "10Q", price: 7.50 },
    { id: 5, title: "Public Safety Confidence", client: "SafeStreets Org", st: "draft", n: 0, type: "5Q", price: 3.50 },
  ],
  clients: [
    { id: 1, name: "IN Health Policy", tier: "Precision", surveys: 3, rev: 4200, st: "active" },
    { id: 2, name: "EduFirst PAC", tier: "Refined", surveys: 2, rev: 3100, st: "active" },
    { id: 3, name: "BuildAmerica", tier: "Standard", surveys: 1, rev: 1800, st: "active" },
    { id: 4, name: "FairTax Coalition", tier: "Precision", surveys: 2, rev: 5600, st: "active" },
    { id: 5, name: "SafeStreets Org", tier: "Standard", surveys: 1, rev: 900, st: "pending" },
  ],
};

/* ===== LANDING PAGE ===== */
function Landing({ onLogin, onSignup }) {
  const m = useIsMobile();

  return (
    <div style={{ minHeight: "100vh", background: T.navy }}>
      {/* NAV */}
      <nav style={{ position: "sticky", top: 0, zIndex: 100, background: T.navy, borderBottom: "1px solid #fff1" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: m ? "0 16px" : "0 32px", display: "flex", justifyContent: "space-between", alignItems: "center", height: 56 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Shield size={24} />
            <span style={{ color: "#fff", fontFamily: "'Libre Baskerville',serif", fontSize: 15, fontWeight: 700 }}>
              Civic<span style={{ color: T.gold }}>Verify</span>
            </span>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={onLogin} style={{ background: "transparent", border: "1px solid #fff4", color: "#fff", borderRadius: 6, padding: "7px 16px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>SIGN IN</button>
            <button onClick={onSignup} style={{ background: T.red, border: "none", color: "#fff", borderRadius: 6, padding: "7px 16px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>JOIN</button>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ padding: m ? "48px 20px" : "80px 40px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: T.gold + "22", border: "1px solid " + T.gold + "44", borderRadius: 30, padding: "6px 18px", marginBottom: 20 }}>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: T.gold }} />
            <span style={{ color: T.gold, fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase" }}>This Is Bigger Than a Survey</span>
          </div>
          <h1 style={{ fontFamily: "'Libre Baskerville',serif", fontSize: m ? 28 : 46, fontWeight: 700, color: "#fff", lineHeight: 1.15, marginBottom: 16, maxWidth: 650 }}>
            The People Who <span style={{ color: T.gold }}>Make Laws</span> Are Listening. <span style={{ color: T.gold }}>Are You Speaking?</span>
          </h1>
          <p style={{ fontSize: m ? 15 : 18, color: "#ffffffbb", lineHeight: 1.7, marginBottom: 12, maxWidth: 560 }}>
            Lawmakers write healthcare bills. Corporations price your groceries. School boards decide what your kids learn. The data driving those decisions? Bots, fake accounts, and people who don't exist.
          </p>
          <p style={{ fontSize: m ? 14 : 16, color: T.gold, lineHeight: 1.6, marginBottom: 28, maxWidth: 560, fontWeight: 700 }}>
            Every policy that affects your paycheck, your family, and your future is shaped by data. If that data doesn't include your real, verified voice - someone else is speaking for you.
          </p>
          <div style={{ display: "flex", flexDirection: m ? "column" : "row", gap: 12 }}>
            <button onClick={onSignup} className="btn btn-r" style={{ padding: "14px 28px", fontSize: 15, width: m ? "100%" : "auto" }}>I WANT MY VOICE HEARD</button>
            <button onClick={onLogin} style={{ background: "transparent", border: "none", color: "#fffc", fontSize: 14, fontWeight: 700, cursor: "pointer", padding: "14px 16px" }}>SIGN IN</button>
          </div>
        </div>
      </section>

      {/* STATS BAR */}
      <section style={{ borderTop: "1px solid #fff1", padding: "30px 16px" }}>
        <div style={{ maxWidth: 800, margin: "0 auto", display: "grid", gridTemplateColumns: m ? "repeat(2,1fr)" : "repeat(4,1fr)", gap: 12, textAlign: "center" }}>
          {[["100%", "ID Verified"], ["Real-Time", "Demographics"], ["Zero", "Fake Accounts"], ["Verified", "Citizens Only"]].map(function(item, i) {
            return (
              <div key={i}>
                <p style={{ fontSize: m ? 22 : 32, fontWeight: 800, color: T.gold, fontFamily: "'Libre Baskerville',serif" }}>{item[0]}</p>
                <p style={{ fontSize: 10, color: "#fff6", textTransform: "uppercase", letterSpacing: 1 }}>{item[1]}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section style={{ background: T.dark, padding: m ? "40px 16px" : "60px 40px", borderTop: "1px solid #fff1" }}>
        <div style={{ maxWidth: 800, margin: "0 auto", textAlign: "center" }}>
          <h2 style={{ fontFamily: "'Libre Baskerville',serif", fontSize: m ? 20 : 28, color: "#fff", marginBottom: 8 }}>
            How <span style={{ color: T.gold }}>CivicVerify</span> Works
          </h2>
          <p style={{ color: "#fff6", fontSize: 13, maxWidth: 500, margin: "0 auto 28px" }}>Three steps to make your verified voice count in the decisions that shape your life.</p>
          <div style={{ display: "grid", gridTemplateColumns: m ? "1fr" : "repeat(3,1fr)", gap: 16 }}>
            {[
              ["1", "Verify Your Identity", "Complete a quick, secure ID verification. Your identity is confirmed but never stored - we verify you're real, then forget the details."],
              ["2", "Share Your Voice", "Answer short, focused surveys on policies that affect you. Healthcare, education, taxes, public safety - issues that matter."],
              ["3", "Shape Real Policy", "Your verified responses go directly to lawmakers, researchers, and organizations. Real data from real people driving real change."]
            ].map(function(step, i) {
              return (
                <div key={i} style={{ background: "#ffffff08", borderRadius: 14, padding: m ? "20px 16px" : "24px 20px", border: "1px solid #fff1", textAlign: "left" }}>
                  <div style={{ width: 32, height: 32, borderRadius: "50%", background: T.gold, color: T.navy, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 14, marginBottom: 12 }}>{step[0]}</div>
                  <h3 style={{ color: "#fff", fontSize: 15, fontWeight: 700, marginBottom: 8 }}>{step[1]}</h3>
                  <p style={{ color: "#fff8", fontSize: 12, lineHeight: 1.6 }}>{step[2]}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* TRUST / NONPARTISAN */}
      <section style={{ background: "#fff", padding: m ? "36px 16px" : "50px 40px" }}>
        <div style={{ maxWidth: 800, margin: "0 auto", textAlign: "center" }}>
          <h2 style={{ fontFamily: "'Libre Baskerville',serif", fontSize: m ? 20 : 28, color: T.navy, marginBottom: 10 }}>
            Independent. Nonpartisan. <span style={{ color: T.gold }}>Verified.</span>
          </h2>
          <p style={{ color: T.gray, fontSize: 13, maxWidth: 560, margin: "0 auto 20px" }}>Not owned by any political party, news network, or special interest group.</p>
          <div style={{ display: "grid", gridTemplateColumns: m ? "1fr 1fr" : "repeat(4,1fr)", gap: 12 }}>
            {[
              ["Zero Political Ties", "No party affiliation. No partisan agenda. Just verified citizen voices."],
              ["No Media Ownership", "Independent from news networks and media conglomerates."],
              ["Built for Citizens", "Designed to serve the people, not corporations or politicians."],
              ["Public Data Seal", "All methodology is transparent. Audit our process anytime."]
            ].map(function(item, i) {
              return (
                <div key={i} style={{ background: T.light, borderRadius: 12, padding: 16, textAlign: "left" }}>
                  <div style={{ width: 28, height: 28, borderRadius: "50%", background: T.navy, marginBottom: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Shield size={14} />
                  </div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 4 }}>{item[0]}</p>
                  <p style={{ fontSize: 11, color: T.gray, lineHeight: 1.5 }}>{item[1]}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* PRIVACY */}
      <section style={{ background: T.cream, padding: "32px 16px" }}>
        <div style={{ maxWidth: 800, margin: "0 auto", display: "grid", gridTemplateColumns: m ? "1fr 1fr" : "repeat(4,1fr)", gap: 12, textAlign: "center" }}>
          {[
            ["ID Never Stored", "Verified then deleted"],
            ["Name Never Sold", "Your data stays yours"],
            ["Delete Anytime", "Full control always"],
            ["Bank-Level Security", "256-bit encryption"]
          ].map(function(item, i) {
            return (
              <div key={i} style={{ padding: 12 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 2 }}>{item[0]}</p>
                <p style={{ fontSize: 11, color: T.gray }}>{item[1]}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* FOR ORGANIZATIONS */}
      <section style={{ background: T.navy, padding: m ? "40px 16px" : "60px 40px", borderTop: "1px solid #fff1" }}>
        <div style={{ maxWidth: 800, margin: "0 auto", textAlign: "center" }}>
          <h2 style={{ fontFamily: "'Libre Baskerville',serif", fontSize: m ? 20 : 28, color: "#fff", marginBottom: 10 }}>
            For <span style={{ color: T.gold }}>Organizations</span>
          </h2>
          <p style={{ color: "#fff8", fontSize: 14, maxWidth: 560, margin: "0 auto 24px", lineHeight: 1.6 }}>
            Access the only polling platform where every single respondent is identity-verified. No bots. No duplicates. No fabricated data. Just real, verified Americans sharing real opinions.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: m ? "1fr" : "repeat(3,1fr)", gap: 12, marginBottom: 24 }}>
            {[
              ["Standard", "$3.50/response", "5-question surveys with verified demographic data"],
              ["Refined", "$5.00/response", "10-question surveys with advanced demographic filtering"],
              ["Precision", "$7.50+/response", "Custom research with granular targeting and priority support"]
            ].map(function(tier, i) {
              return (
                <div key={i} style={{ background: "#ffffff0a", borderRadius: 14, padding: 20, border: "1px solid #fff1", textAlign: "left" }}>
                  <p style={{ color: T.gold, fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{tier[0]}</p>
                  <p style={{ color: "#fff", fontSize: 20, fontWeight: 800, marginBottom: 8 }}>{tier[1]}</p>
                  <p style={{ color: "#fff7", fontSize: 12, lineHeight: 1.5 }}>{tier[2]}</p>
                </div>
              );
            })}
          </div>
          <button onClick={onSignup} className="btn btn-g" style={{ padding: "12px 28px", fontSize: 14 }}>GET STARTED</button>
        </div>
      </section>

      {/* FOOTER CTA */}
      <section style={{ background: T.dark, padding: m ? "40px 16px" : "50px 40px", textAlign: "center" }}>
        <div style={{ maxWidth: 600, margin: "0 auto" }}>
          <Shield size={36} />
          <h2 style={{ fontFamily: "'Libre Baskerville',serif", fontSize: m ? 20 : 28, color: "#fff", margin: "12px 0 8px" }}>
            Your Voice. <span style={{ color: T.gold }}>Verified.</span>
          </h2>
          <p style={{ color: "#fff8", fontSize: 13, marginBottom: 20, lineHeight: 1.6 }}>
            Join thousands of verified citizens making their voices heard on the policies that shape their lives. It's free. It's secure. It matters.
          </p>
          <button onClick={onSignup} className="btn btn-r" style={{ padding: "14px 32px", fontSize: 15 }}>JOIN CIVICVERIFY</button>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ background: T.navy, borderTop: "1px solid #fff1", padding: "16px", textAlign: "center" }}>
        <p style={{ color: "#fff4", fontSize: 11 }}>CivicVerify 2025. Independent. Nonpartisan. Verified.</p>
      </footer>
    </div>
  );
}

/* ===== AUTH ===== */
function Auth({ mode, onOk, goBack }) {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState("");

  const submit = () => {
    if (mode === "login") {
      if (email === "admin@civicverify.org" && pass === "admin123") {
        onOk({ name: "Admin", email: email, role: "admin" });
      } else if (email === "citizen@test.com" && pass === "test123") {
        onOk({ name: "Sarah Chen", email: email, role: "citizen" });
      } else if (email === "org@test.com" && pass === "test123") {
        onOk({ name: "IN Health Policy", email: email, role: "org" });
      } else {
        setError("Invalid credentials. Try admin@civicverify.org / admin123");
      }
    } else {
      if (email && pass) {
        onOk({ name: "New User", email: email, role: "citizen" });
      } else {
        setError("Please fill all fields");
      }
    }
  };

  const inputStyle = { width: "100%", padding: "12px 14px", borderRadius: 10, border: "1px solid #ddd", fontSize: 14, outline: "none" };

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(160deg," + T.navy + "," + T.dark + ")", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ width: "100%", maxWidth: 400 }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <Shield size={44} />
          <h1 style={{ color: "#fff", fontFamily: "'Libre Baskerville',serif", fontSize: 22, marginTop: 10 }}>CivicVerify</h1>
        </div>
        <div style={{ background: "#fff", borderRadius: 16, padding: "28px 22px" }}>
          <h2 style={{ fontSize: 18, textAlign: "center", marginBottom: 20, color: T.navy }}>{mode === "login" ? "Sign In" : "Create Account"}</h2>
          {error && <div style={{ background: "#fde8e8", padding: "10px 14px", borderRadius: 8, marginBottom: 14, fontSize: 13, color: T.red }}>{error}</div>}
          <div style={{ marginBottom: 14 }}>
            <input style={inputStyle} value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" />
          </div>
          <div style={{ marginBottom: 18 }}>
            <input style={inputStyle} type="password" value={pass} onChange={e => setPass(e.target.value)} placeholder="Password" />
          </div>
          <button onClick={submit} className="btn btn-r" style={{ width: "100%", padding: "13px", fontSize: 15 }}>
            {mode === "login" ? "SIGN IN" : "CREATE ACCOUNT"}
          </button>
          <button onClick={goBack} style={{ width: "100%", marginTop: 12, padding: "10px", background: "none", border: "none", color: T.gray, fontSize: 13, cursor: "pointer" }}>
            Back to Home
          </button>
          <div style={{ marginTop: 16, padding: "12px", background: T.light, borderRadius: 8, fontSize: 11, color: T.gray }}>
            <strong>Demo Accounts:</strong><br />
            Admin: admin@civicverify.org / admin123<br />
            Citizen: citizen@test.com / test123<br />
            Org: org@test.com / test123
          </div>
        </div>
      </div>
    </div>
  );
}

/* ===== ADMIN SIDEBAR ===== */
function AdminSidebar({ page, setPage, onOut, mobile, onClose }) {
  const items = [
    ["Dashboard", "dash"],
    ["Review Queue", "rev"],
    ["Surveys", "sv"],
    ["Respondents", "rsp"],
    ["Clients", "cls"],
    ["Analytics", "an"],
    ["Settings", "set"],
  ];
  return (
    <div style={{ width: mobile ? 240 : 220, flexShrink: 0, background: T.navy, position: mobile ? "fixed" : "relative", top: 0, left: 0, bottom: 0, zIndex: 60, overflow: "auto", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "16px 14px", display: "flex", alignItems: "center", gap: 8, borderBottom: "1px solid #fff1" }}>
        <Shield size={24} />
        <div>
          <p style={{ color: "#fff", fontFamily: "'Libre Baskerville',serif", fontSize: 14, fontWeight: 700 }}>
            Civic<span style={{ color: T.gold }}>Verify</span>
          </p>
          <p style={{ color: "#fff5", fontSize: 10 }}>Admin Panel</p>
        </div>
      </div>
      <nav style={{ padding: "10px 6px", flex: 1 }}>
        {items.map(function(item) {
          const label = item[0];
          const key = item[1];
          const active = page === key;
          return (
            <button
              key={key}
              onClick={function() { setPage(key); if (onClose) onClose(); }}
              style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "10px 12px", borderRadius: 8, background: active ? "#C5960C1F" : "transparent", border: "none", color: active ? T.gold : "#fff8", fontSize: 13, fontWeight: 600, cursor: "pointer", textAlign: "left", marginBottom: 2 }}
            >
              {label}
            </button>
          );
        })}
      </nav>
      <div style={{ padding: "10px 14px", borderTop: "1px solid #fff1" }}>
        <button onClick={onOut} style={{ background: "#fff1", border: "none", color: "#fff6", fontSize: 11, padding: "8px", borderRadius: 6, cursor: "pointer", width: "100%" }}>
          Sign Out
        </button>
      </div>
    </div>
  );
}

/* ===== ADMIN PAGES ===== */
function DashPage({ mobile }) {
  const rsp = DATA.respondents;
  const sv = DATA.surveys;
  const cls = DATA.clients;
  const vf = rsp.filter(function(r) { return r.vf; }).length;
  const totalR = sv.reduce(function(s, x) { return s + x.n; }, 0);
  const rev = cls.reduce(function(s, c) { return s + c.rev; }, 0);

  const stats = [
    { label: "Verified Users", val: vf, sub: "of " + rsp.length + " total" },
    { label: "Total Responses", val: totalR.toLocaleString(), sub: "across " + sv.length + " surveys" },
    { label: "Revenue", val: "$" + rev.toLocaleString(), sub: "from " + cls.length + " clients" },
    { label: "Verification Rate", val: Math.round((vf / rsp.length) * 100) + "%", sub: "identity confirmed" },
  ];

  return (
    <div>
      <h2 style={{ fontSize: mobile ? 18 : 22, fontWeight: 700, color: T.navy, marginBottom: 16 }}>Dashboard</h2>
      <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr 1fr" : "repeat(4,1fr)", gap: 10, marginBottom: 20 }}>
        {stats.map(function(s, i) {
          return (
            <div key={i} className="card" style={{ padding: 14, textAlign: "center" }}>
              <p style={{ fontSize: 22, fontWeight: 700, color: T.navy }}>{s.val}</p>
              <p style={{ fontSize: 11, color: T.gray, marginTop: 2 }}>{s.label}</p>
              <p style={{ fontSize: 10, color: T.bone }}>{s.sub}</p>
            </div>
          );
        })}
      </div>
      <div className="card" style={{ padding: 16 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Active Surveys</h3>
        {sv.filter(function(x) { return x.st === "active"; }).map(function(s) {
          return (
            <div key={s.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #f0f0f0" }}>
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: T.dark }}>{s.title}</p>
                <p style={{ fontSize: 11, color: T.gray }}>{s.client}</p>
              </div>
              <div style={{ textAlign: "right" }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: T.navy }}>{s.n}</p>
                <p style={{ fontSize: 10, color: T.gray }}>responses</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ReviewPage() {
  return (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: T.navy, marginBottom: 16 }}>Review Queue</h2>
      <div className="card" style={{ padding: 20, textAlign: "center" }}>
        <p style={{ color: T.gray, fontSize: 14 }}>No surveys pending review</p>
        <p style={{ color: T.bone, fontSize: 12, marginTop: 4 }}>Submitted organization surveys will appear here for approval</p>
      </div>
    </div>
  );
}

function SurveyPage({ mobile }) {
  const [q, setQ] = useState("");
  const sv = DATA.surveys;
  const filtered = sv.filter(function(s) { return s.title.toLowerCase().includes(q.toLowerCase()); });
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
        <h2 style={{ fontSize: mobile ? 18 : 20, fontWeight: 700, color: T.navy }}>Surveys</h2>
        <input value={q} onChange={function(e) { setQ(e.target.value); }} placeholder="Search surveys..." style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #ddd", fontSize: 13, width: mobile ? "100%" : 220 }} />
      </div>
      <div style={{ overflowX: "auto" }}>
        <table>
          <thead>
            <tr>
              <th>Survey</th>
              <th>Client</th>
              <th>Status</th>
              <th>Responses</th>
              {!mobile && <th>Type</th>}
              {!mobile && <th>Price</th>}
            </tr>
          </thead>
          <tbody>
            {filtered.map(function(s) {
              var statusColor = s.st === "active" ? "green" : s.st === "completed" ? "gray" : "gold";
              return (
                <tr key={s.id}>
                  <td style={{ fontWeight: 600, color: T.navy }}>{s.title}</td>
                  <td>{s.client}</td>
                  <td><Badge text={s.st} color={statusColor} /></td>
                  <td>{s.n}</td>
                  {!mobile && <td>{s.type}</td>}
                  {!mobile && <td>{"$" + s.price.toFixed(2)}</td>}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function RespondentPage({ mobile }) {
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(null);
  const rsp = DATA.respondents;
  const filtered = rsp.filter(function(r) {
    return r.name.toLowerCase().includes(q.toLowerCase()) || r.st.toLowerCase().includes(q.toLowerCase());
  });

  if (sel) {
    return (
      <div>
        <button onClick={function() { setSel(null); }} style={{ background: "none", border: "none", color: T.red, fontSize: 13, cursor: "pointer", marginBottom: 12, fontWeight: 600 }}>
          Back to List
        </button>
        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: T.navy, marginBottom: 12 }}>{sel.name}</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div><p style={{ fontSize: 11, color: T.gray }}>Email</p><p style={{ fontSize: 13 }}>{sel.email}</p></div>
            <div><p style={{ fontSize: 11, color: T.gray }}>Status</p><Badge text={sel.vf ? "Verified" : "Pending"} color={sel.vf ? "green" : "red"} /></div>
            <div><p style={{ fontSize: 11, color: T.gray }}>State</p><p style={{ fontSize: 13 }}>{sel.st}</p></div>
            <div><p style={{ fontSize: 11, color: T.gray }}>Age</p><p style={{ fontSize: 13 }}>{sel.age}</p></div>
            <div><p style={{ fontSize: 11, color: T.gray }}>Party</p><p style={{ fontSize: 13 }}>{sel.party}</p></div>
            <div><p style={{ fontSize: 11, color: T.gray }}>Joined</p><p style={{ fontSize: 13 }}>{sel.dt}</p></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
        <h2 style={{ fontSize: mobile ? 18 : 20, fontWeight: 700, color: T.navy }}>Respondents</h2>
        <input value={q} onChange={function(e) { setQ(e.target.value); }} placeholder="Search..." style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #ddd", fontSize: 13, width: mobile ? "100%" : 220 }} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr 1fr" : "repeat(4,1fr)", gap: 8, marginBottom: 16 }}>
        <div className="card" style={{ padding: 10, textAlign: "center" }}>
          <p style={{ fontSize: 18, fontWeight: 700, color: T.navy }}>{rsp.length}</p>
          <p style={{ fontSize: 10, color: T.gray }}>Total</p>
        </div>
        <div className="card" style={{ padding: 10, textAlign: "center" }}>
          <p style={{ fontSize: 18, fontWeight: 700, color: T.green }}>{rsp.filter(function(r){return r.vf;}).length}</p>
          <p style={{ fontSize: 10, color: T.gray }}>Verified</p>
        </div>
        <div className="card" style={{ padding: 10, textAlign: "center" }}>
          <p style={{ fontSize: 18, fontWeight: 700, color: T.red }}>{rsp.filter(function(r){return !r.vf;}).length}</p>
          <p style={{ fontSize: 10, color: T.gray }}>Pending</p>
        </div>
        <div className="card" style={{ padding: 10, textAlign: "center" }}>
          <p style={{ fontSize: 18, fontWeight: 700, color: T.gold }}>{new Set(rsp.map(function(r){return r.st;})).size}</p>
          <p style={{ fontSize: 10, color: T.gray }}>States</p>
        </div>
      </div>
      <div style={{ overflowX: "auto" }}>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Status</th>
              <th>State</th>
              {!mobile && <><th>Age</th><th>Party</th></>}
              <th>Joined</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(function(r) {
              return (
                <tr key={r.id} style={{ cursor: "pointer" }} onClick={function() { setSel(r); }}>
                  <td style={{ fontWeight: 600, color: T.navy }}>{r.name}</td>
                  <td><Badge text={r.vf ? "Verified" : "Pending"} color={r.vf ? "green" : "red"} /></td>
                  <td>{r.st}</td>
                  {!mobile && <><td>{r.age}</td><td>{r.party}</td></>}
                  <td style={{ fontSize: 12 }}>{r.dt}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ClientPage({ mobile }) {
  const cls = DATA.clients;
  return (
    <div>
      <h2 style={{ fontSize: mobile ? 18 : 20, fontWeight: 700, color: T.navy, marginBottom: 16 }}>Clients</h2>
      <div style={{ overflowX: "auto" }}>
        <table>
          <thead>
            <tr>
              <th>Organization</th>
              <th>Tier</th>
              <th>Surveys</th>
              {!mobile && <th>Revenue</th>}
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {cls.map(function(c) {
              return (
                <tr key={c.id}>
                  <td style={{ fontWeight: 600, color: T.navy }}>{c.name}</td>
                  <td><Badge text={c.tier} color={c.tier === "Precision" ? "gold" : c.tier === "Refined" ? "green" : "gray"} /></td>
                  <td>{c.surveys}</td>
                  {!mobile && <td>{"$" + c.rev.toLocaleString()}</td>}
                  <td><Badge text={c.st} color={c.st === "active" ? "green" : "gold"} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AnalyticsPage({ mobile }) {
  const months = [
    { m: "Oct", r: 320, u: 80, rv: 1600 },
    { m: "Nov", r: 580, u: 150, rv: 2900 },
    { m: "Dec", r: 890, u: 220, rv: 4450 },
    { m: "Jan", r: 1340, u: 380, rv: 6700 },
    { m: "Feb", r: 1870, u: 520, rv: 9350 },
  ];
  var maxR = Math.max.apply(null, months.map(function(x) { return x.r; }));
  return (
    <div>
      <h2 style={{ fontSize: mobile ? 18 : 20, fontWeight: 700, color: T.navy, marginBottom: 16 }}>Analytics</h2>
      <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "1fr 1fr", gap: 16 }}>
        <div className="card" style={{ padding: 16 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Response Growth</h3>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 120 }}>
            {months.map(function(d, i) {
              var pct = (d.r / maxR) * 100;
              return (
                <div key={i} style={{ flex: 1, textAlign: "center" }}>
                  <div style={{ background: T.navy, height: pct + "%", borderRadius: "4px 4px 0 0", minHeight: 4, transition: "height .3s" }} />
                  <p style={{ fontSize: 10, color: T.gray, marginTop: 4 }}>{d.m}</p>
                </div>
              );
            })}
          </div>
        </div>
        <div className="card" style={{ padding: 16 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Monthly Revenue</h3>
          {months.map(function(d, i) {
            return (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #f0f0f0" }}>
                <span style={{ fontSize: 13, color: T.dark }}>{d.m}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: T.green }}>{"$" + d.rv.toLocaleString()}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function SettingsPage() {
  return (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: T.navy, marginBottom: 16 }}>Settings</h2>
      <div className="card" style={{ padding: 20 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Platform Configuration</h3>
        <div style={{ display: "grid", gap: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #f0f0f0" }}>
            <span style={{ fontSize: 13 }}>Require ID Verification</span>
            <Badge text="Enabled" color="green" />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #f0f0f0" }}>
            <span style={{ fontSize: 13 }}>Auto-approve Standard Surveys</span>
            <Badge text="Disabled" color="gray" />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #f0f0f0" }}>
            <span style={{ fontSize: 13 }}>Response Rate Limit</span>
            <span style={{ fontSize: 13, fontWeight: 600 }}>5 per day</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ===== ADMIN LAYOUT ===== */
function Admin({ user, onOut }) {
  const mobile = useIsMobile();
  const [page, setPage] = useState("dash");
  const [sideOpen, setSideOpen] = useState(false);

  var content = null;
  if (page === "dash") { content = <DashPage mobile={mobile} />; }
  else if (page === "rev") { content = <ReviewPage />; }
  else if (page === "sv") { content = <SurveyPage mobile={mobile} />; }
  else if (page === "rsp") { content = <RespondentPage mobile={mobile} />; }
  else if (page === "cls") { content = <ClientPage mobile={mobile} />; }
  else if (page === "an") { content = <AnalyticsPage mobile={mobile} />; }
  else if (page === "set") { content = <SettingsPage />; }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: T.light }}>
      {(!mobile || sideOpen) && (
        <AdminSidebar page={page} setPage={setPage} onOut={onOut} mobile={mobile} onClose={function() { setSideOpen(false); }} />
      )}
      {mobile && sideOpen && (
        <div onClick={function() { setSideOpen(false); }} style={{ position: "fixed", inset: 0, background: "#0006", zIndex: 55 }} />
      )}
      <div style={{ flex: 1, overflow: "auto" }}>
        {mobile && (
          <div style={{ background: "#fff", padding: "10px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #eee" }}>
            <button onClick={function() { setSideOpen(true); }} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer" }}>
              {"="}
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Shield size={18} />
              <span style={{ fontFamily: "'Libre Baskerville',serif", fontSize: 13, fontWeight: 700, color: T.navy }}>
                Civic<span style={{ color: T.gold }}>Verify</span>
              </span>
            </div>
            <div style={{ width: 20 }} />
          </div>
        )}
        <div style={{ padding: mobile ? "14px" : "24px 28px", maxWidth: 1100 }}>
          {content}
        </div>
      </div>
    </div>
  );
}

/* ===== CITIZEN APP ===== */
function CitizenApp({ user, onOut }) {
  const mobile = useIsMobile();
  const [tab, setTab] = useState("surveys");
  const [completed, setCompleted] = useState([]);
  const [activeSurvey, setActiveSurvey] = useState(null);
  const [answers, setAnswers] = useState({});

  var surveys = DATA.surveys.filter(function(s) { return s.st === "active"; });

  /* Survey Taking View */
  if (activeSurvey) {
    var qs = activeSurvey.type === "5Q"
      ? ["How would you rate the current state of this issue?", "How much does this issue affect your daily life?", "Do you support increased government spending on this issue?", "How confident are you in current leadership on this issue?", "Would you support a ballot measure on this issue?"]
      : ["How would you rate the current state of this issue?", "How much does this issue affect your daily life?", "Do you support increased government spending on this issue?", "How confident are you in current leadership on this issue?", "Would you support a ballot measure on this issue?", "How informed do you feel about this issue?", "Should this be a state or federal priority?", "Rate the transparency of current policy on this issue.", "How important is this compared to other issues?", "Would you attend a town hall on this issue?"];
    var opts = ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"];
    var allAnswered = qs.every(function(_, i) { return answers[i] !== undefined; });

    return (
      <div style={{ minHeight: "100vh", background: T.light }}>
        <header style={{ background: "#fff", padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #eee" }}>
          <button onClick={function() { setActiveSurvey(null); setAnswers({}); }} style={{ background: "none", border: "none", color: T.red, fontSize: 13, cursor: "pointer", fontWeight: 600 }}>Exit Survey</button>
          <span style={{ fontSize: 12, color: T.gray }}>{Object.keys(answers).length}/{qs.length} answered</span>
        </header>
        <div style={{ padding: mobile ? 14 : 24, maxWidth: 600, margin: "0 auto" }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: T.navy, marginBottom: 4 }}>{activeSurvey.title}</h2>
          <p style={{ fontSize: 12, color: T.gray, marginBottom: 20 }}>{activeSurvey.type} Survey for {activeSurvey.client}</p>
          {qs.map(function(q, qi) {
            return (
              <div key={qi} className="card" style={{ padding: 16, marginBottom: 10 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: T.dark, marginBottom: 10 }}>{(qi + 1) + ". " + q}</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {opts.map(function(o, oi) {
                    var selected = answers[qi] === oi;
                    return (
                      <button key={oi} onClick={function() { setAnswers(function(prev) { var n = Object.assign({}, prev); n[qi] = oi; return n; }); }} style={{ padding: "6px 12px", borderRadius: 20, fontSize: 11, fontWeight: 600, border: selected ? "2px solid " + T.red : "1px solid #ddd", background: selected ? T.red + "12" : "#fff", color: selected ? T.red : T.gray, cursor: "pointer" }}>
                        {o}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
          {allAnswered && (
            <button onClick={function() { setCompleted(function(prev) { return prev.concat([activeSurvey.id]); }); setActiveSurvey(null); setAnswers({}); }} className="btn btn-r" style={{ width: "100%", padding: "14px", fontSize: 15, marginTop: 8 }}>
              SUBMIT SURVEY
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: T.light }}>
      <header style={{ background: "#fff", padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #eee" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Shield size={22} />
          <span style={{ fontFamily: "'Libre Baskerville',serif", fontSize: 14, fontWeight: 700, color: T.navy }}>
            Civic<span style={{ color: T.gold }}>Verify</span>
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Badge text="Verified" color="green" />
          <span style={{ fontSize: 12, color: T.gray }}>{user.name}</span>
        </div>
      </header>
      <div style={{ display: "flex", justifyContent: "center", gap: 0, borderBottom: "1px solid #eee", background: "#fff" }}>
        {["surveys", "impact", "account"].map(function(t) {
          return (
            <button key={t} onClick={function() { setTab(t); }} style={{ padding: "12px 20px", background: "none", border: "none", borderBottom: tab === t ? "2px solid " + T.red : "2px solid transparent", color: tab === t ? T.navy : T.gray, fontWeight: 600, fontSize: 13, cursor: "pointer", textTransform: "capitalize" }}>
              {t}
            </button>
          );
        })}
      </div>
      <div style={{ padding: mobile ? 14 : 24, maxWidth: 600, margin: "0 auto" }}>
        {tab === "surveys" && (
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: T.navy, marginBottom: 4 }}>Available Surveys</h2>
            <p style={{ fontSize: 13, color: T.gray, marginBottom: 16 }}>Complete surveys to make your voice heard on policy decisions</p>
            {surveys.map(function(s) {
              var done = completed.includes(s.id);
              return (
                <div key={s.id} className="card" style={{ padding: 16, marginBottom: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 600, color: T.dark }}>{s.title}</p>
                      <p style={{ fontSize: 11, color: T.gray }}>{s.type} Survey - {s.client}</p>
                    </div>
                    {done ? (
                      <Badge text="Completed" color="green" />
                    ) : (
                      <button onClick={function() { setActiveSurvey(s); }} className="btn btn-r" style={{ padding: "8px 16px", fontSize: 12 }}>
                        Take Survey
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
            {completed.length === surveys.length && (
              <div className="card" style={{ padding: 20, textAlign: "center", marginTop: 8, background: T.green + "08", border: "1px solid " + T.green + "22" }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: T.green }}>All surveys completed!</p>
                <p style={{ fontSize: 12, color: T.gray, marginTop: 4 }}>New surveys are added regularly. Check back soon.</p>
              </div>
            )}
          </div>
        )}
        {tab === "impact" && (
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: T.navy, marginBottom: 16 }}>Your Impact</h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
              <div className="card" style={{ padding: 16, textAlign: "center" }}>
                <p style={{ fontSize: 32, fontWeight: 700, color: T.navy }}>{completed.length}</p>
                <p style={{ fontSize: 11, color: T.gray }}>Surveys Completed</p>
              </div>
              <div className="card" style={{ padding: 16, textAlign: "center" }}>
                <p style={{ fontSize: 32, fontWeight: 700, color: T.gold }}>{completed.length * (mobile ? 5 : 7)}</p>
                <p style={{ fontSize: 11, color: T.gray }}>Questions Answered</p>
              </div>
            </div>
            <div className="card" style={{ padding: 20, marginBottom: 12 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: T.navy, marginBottom: 8 }}>How Your Data is Used</h3>
              <p style={{ fontSize: 13, color: T.gray, lineHeight: 1.6 }}>
                Your verified responses are aggregated anonymously and provided to policymakers, researchers, and organizations. Your individual identity is never shared. Only demographic patterns and opinion distributions are reported.
              </p>
            </div>
            <div className="card" style={{ padding: 20 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: T.navy, marginBottom: 8 }}>Your Privacy</h3>
              <p style={{ fontSize: 13, color: T.gray, lineHeight: 1.6 }}>
                CivicVerify uses bank-level 256-bit encryption. Your ID was verified and then deleted. Your name is never sold. You can delete your account and all associated data at any time.
              </p>
            </div>
          </div>
        )}
        {tab === "account" && (
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: T.navy, marginBottom: 16 }}>Account</h2>
            <div className="card" style={{ padding: 20, marginBottom: 16 }}>
              <div style={{ display: "grid", gap: 14 }}>
                <div>
                  <p style={{ fontSize: 11, color: T.gray }}>Name</p>
                  <p style={{ fontSize: 14, fontWeight: 600 }}>{user.name}</p>
                </div>
                <div>
                  <p style={{ fontSize: 11, color: T.gray }}>Email</p>
                  <p style={{ fontSize: 14 }}>{user.email}</p>
                </div>
                <div>
                  <p style={{ fontSize: 11, color: T.gray }}>Verification Status</p>
                  <Badge text="Identity Verified" color="green" />
                </div>
                <div>
                  <p style={{ fontSize: 11, color: T.gray }}>Member Since</p>
                  <p style={{ fontSize: 14 }}>January 2025</p>
                </div>
                <div>
                  <p style={{ fontSize: 11, color: T.gray }}>Surveys Completed</p>
                  <p style={{ fontSize: 14, fontWeight: 600 }}>{completed.length}</p>
                </div>
              </div>
            </div>
            <button onClick={onOut} className="btn btn-o" style={{ color: T.red, borderColor: T.red, width: "100%", padding: "12px" }}>
              Sign Out
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ===== ORG PORTAL ===== */
function OrgPortal({ user, onOut }) {
  const mobile = useIsMobile();
  return (
    <div style={{ minHeight: "100vh", background: T.light }}>
      <header style={{ background: "#fff", padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #eee" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Shield size={22} />
          <span style={{ fontFamily: "'Libre Baskerville',serif", fontSize: 14, fontWeight: 700, color: T.navy }}>
            Civic<span style={{ color: T.gold }}>Verify</span>
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 12, color: T.gray }}>{user.name}</span>
          <button onClick={onOut} style={{ background: "none", border: "none", color: T.red, fontSize: 12, cursor: "pointer", fontWeight: 600 }}>Out</button>
        </div>
      </header>
      <div style={{ padding: mobile ? 14 : 24, maxWidth: 800, margin: "0 auto" }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: T.navy, marginBottom: 16 }}>Organization Dashboard</h2>
        <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "1fr 1fr 1fr", gap: 12, marginBottom: 20 }}>
          <div className="card" style={{ padding: 16, textAlign: "center" }}>
            <p style={{ fontSize: 24, fontWeight: 700, color: T.navy }}>3</p>
            <p style={{ fontSize: 11, color: T.gray }}>Active Surveys</p>
          </div>
          <div className="card" style={{ padding: 16, textAlign: "center" }}>
            <p style={{ fontSize: 24, fontWeight: 700, color: T.green }}>1,882</p>
            <p style={{ fontSize: 11, color: T.gray }}>Total Responses</p>
          </div>
          <div className="card" style={{ padding: 16, textAlign: "center" }}>
            <p style={{ fontSize: 24, fontWeight: 700, color: T.gold }}>Precision</p>
            <p style={{ fontSize: 11, color: T.gray }}>Your Tier</p>
          </div>
        </div>
        <div className="card" style={{ padding: 20, marginBottom: 16 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Your Surveys</h3>
          {DATA.surveys.slice(0, 3).map(function(s) {
            return (
              <div key={s.id} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #f0f0f0" }}>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600 }}>{s.title}</p>
                  <p style={{ fontSize: 11, color: T.gray }}>{s.type} - {s.n} responses</p>
                </div>
                <Badge text={s.st} color={s.st === "active" ? "green" : "gray"} />
              </div>
            );
          })}
        </div>
        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: T.navy, marginBottom: 8 }}>Why CivicVerify?</h3>
          <p style={{ fontSize: 13, color: T.gray, lineHeight: 1.6 }}>
            Unlike traditional polling, every CivicVerify respondent is identity-verified. This means your survey data represents real, verified citizens - not bots, duplicate accounts, or fabricated responses. Organizations trust CivicVerify for policy research, public opinion analysis, and civic engagement data.
          </p>
        </div>
        <button onClick={onOut} className="btn btn-o" style={{ color: T.red, borderColor: T.red, width: "100%", marginTop: 16 }}>Sign Out</button>
      </div>
    </div>
  );
}

/* ===== MAIN APP ===== */
export default function App() {
  const [user, setUser] = useState(null);
  const [screen, setScreen] = useState("landing");

  var handleAuth = function(u) {
    setUser(u);
    if (u.role === "admin") { setScreen("admin"); }
    else if (u.role === "org") { setScreen("org"); }
    else { setScreen("citizen"); }
  };

  var handleOut = function() {
    setUser(null);
    setScreen("landing");
  };

  return (
    <div>
      <style>{globalCSS}</style>
      {screen === "landing" && <Landing onLogin={function() { setScreen("login"); }} onSignup={function() { setScreen("signup"); }} />}
      {screen === "login" && <Auth mode="login" onOk={handleAuth} goBack={function() { setScreen("landing"); }} />}
      {screen === "signup" && <Auth mode="signup" onOk={handleAuth} goBack={function() { setScreen("landing"); }} />}
      {screen === "admin" && user && <Admin user={user} onOut={handleOut} />}
      {screen === "citizen" && user && <CitizenApp user={user} onOut={handleOut} />}
      {screen === "org" && user && <OrgPortal user={user} onOut={handleOut} />}
    </div>
  );
}
