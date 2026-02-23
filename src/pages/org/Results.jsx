import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { supabase } from "../../supabaseClient";
import useAuth from "../../hooks/useAuth";

const NAVY = "#0B2545";
const GOLD = "#C5960C";
const CREAM = "#F5F1EC";
const GREEN = "#22863A";
const RED = "#B8352E";

const CHART_COLORS = [NAVY, GOLD, "#4A7FBD", "#E8A838", "#2E7D5A", "#D15F3E", "#6B5EA8", "#5A8FA0"];

// ─── Helpers ───────────────────────────────────────────────────────────────

function formatDate(iso) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}

function pct(num, total) {
  if (!total) return "0%";
  return `${Math.round((num / total) * 100)}%`;
}

// ─── Stat Card ─────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, color }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="text-2xl font-bold" style={{ color: color || NAVY, fontFamily: "Libre Baskerville, serif" }}>
        {value}
      </p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

// ─── Multiple Choice Chart ──────────────────────────────────────────────────

function MCChart({ question, answers }) {
  const options = question.options || [];
  const data = options.map((opt) => ({
    name: opt.length > 30 ? opt.slice(0, 28) + "…" : opt,
    fullName: opt,
    count: answers.filter((a) => a === opt).length,
  }));
  const total = answers.length;

  return (
    <div>
      <ResponsiveContainer width="100%" height={Math.max(180, data.length * 44)}>
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 40, left: 8, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F0EDE8" />
          <XAxis type="number" domain={[0, total || 1]} tickLine={false} axisLine={false}
            tick={{ fontSize: 11, fill: "#9CA3AF" }} />
          <YAxis type="category" dataKey="name" width={140} tickLine={false} axisLine={false}
            tick={{ fontSize: 12, fill: "#374151" }} />
          <Tooltip
            formatter={(val, _, props) => [`${val} responses (${pct(val, total)})`, props.payload.fullName]}
            contentStyle={{ borderRadius: 8, border: "1px solid #E5E7EB", fontSize: 12 }}
          />
          <Bar dataKey="count" radius={[0, 4, 4, 0]}>
            {data.map((_, i) => (
              <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      {/* Percentage breakdown */}
      <div className="mt-3 space-y-1.5">
        {data.map((d, i) => (
          <div key={i} className="flex items-center justify-between text-xs text-gray-600">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
                style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
              <span className="line-clamp-1">{d.fullName}</span>
            </div>
            <span className="font-medium ml-3 flex-shrink-0">
              {d.count} ({pct(d.count, total)})
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Rating Chart ────────────────────────────────────────────────────────────

function RatingChart({ answers, scale = 5 }) {
  const buckets = Array.from({ length: scale }, (_, i) => {
    const val = i + 1;
    return { name: `${val}`, count: answers.filter((a) => Number(a) === val).length };
  });
  const total = answers.length;
  const avg = total > 0
    ? (answers.reduce((sum, a) => sum + Number(a), 0) / total).toFixed(2)
    : "—";

  return (
    <div>
      <div className="flex items-center gap-3 mb-3">
        <div className="text-center">
          <p className="text-3xl font-bold" style={{ color: NAVY, fontFamily: "Libre Baskerville, serif" }}>{avg}</p>
          <p className="text-xs text-gray-400">avg out of {scale}</p>
        </div>
        <div className="flex-1">
          {buckets.map((b) => (
            <div key={b.name} className="flex items-center gap-2 mb-1">
              <span className="text-xs w-3 text-gray-500 text-right">{b.name}</span>
              <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                <div className="h-2 rounded-full transition-all"
                  style={{ width: pct(b.count, total), backgroundColor: GOLD }} />
              </div>
              <span className="text-xs text-gray-500 w-8">{pct(b.count, total)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Yes/No Chart ────────────────────────────────────────────────────────────

function YesNoChart({ answers }) {
  const yes = answers.filter((a) => a === "Yes" || a === true || a === "true").length;
  const no = answers.length - yes;
  const data = [
    { name: "Yes", value: yes },
    { name: "No", value: no },
  ];
  return (
    <div className="flex items-center gap-6">
      <ResponsiveContainer width={140} height={140}>
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={38} outerRadius={60}
            paddingAngle={3} dataKey="value">
            <Cell fill={GREEN} />
            <Cell fill={RED} />
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="space-y-2">
        {data.map((d, i) => (
          <div key={d.name} className="flex items-center gap-2 text-sm">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: i === 0 ? GREEN : RED }} />
            <span className="text-gray-700 font-medium">{d.name}</span>
            <span className="text-gray-500">{d.value} ({pct(d.value, answers.length)})</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Text Responses ──────────────────────────────────────────────────────────

function TextResponses({ answers }) {
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? answers : answers.slice(0, 5);

  if (!answers.length) return <p className="text-sm text-gray-400 italic">No responses yet.</p>;

  return (
    <div>
      <div className="space-y-2">
        {visible.map((a, i) => (
          <div key={i} className="px-3 py-2 bg-gray-50 rounded-lg text-sm text-gray-700 border border-gray-100">
            "{a}"
          </div>
        ))}
      </div>
      {answers.length > 5 && (
        <button onClick={() => setShowAll(!showAll)}
          className="mt-3 text-sm font-medium underline" style={{ color: NAVY }}>
          {showAll ? "Show less" : `Show all ${answers.length} responses`}
        </button>
      )}
    </div>
  );
}

// ─── Question Result Card ────────────────────────────────────────────────────

function QuestionCard({ question, index, answers }) {
  const responded = answers.filter((a) => a !== null && a !== undefined && a !== "").length;

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1 block">
            Q{index + 1} · {question.type?.replace("_", " ")}
          </span>
          <h3 className="font-semibold text-base" style={{ color: NAVY, fontFamily: "Libre Baskerville, serif" }}>
            {question.text}
          </h3>
        </div>
        <span className="text-xs text-gray-400 whitespace-nowrap">{responded} responses</span>
      </div>

      {question.type === "multiple_choice" && <MCChart question={question} answers={answers} />}
      {question.type === "rating" && <RatingChart answers={answers} scale={question.scale || 5} />}
      {question.type === "yes_no" && <YesNoChart answers={answers} />}
      {question.type === "text" && <TextResponses answers={answers} />}
    </div>
  );
}

// ─── Demographic Breakdown ────────────────────────────────────────────────────

function DemographicSection({ respondents }) {
  if (!respondents.length) return null;

  function buildData(key, labels = {}) {
    const counts = {};
    respondents.forEach((r) => {
      const val = r[key] || "Unknown";
      counts[val] = (counts[val] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, count]) => ({ name: labels[name] || name, count }));
  }

  const stateData = buildData("state");
  const partyData = buildData("political_party");
  const ageData = respondents
    .map((r) => {
      if (!r.date_of_birth) return null;
      const age = new Date().getFullYear() - new Date(r.date_of_birth).getFullYear();
      if (age < 25) return "18–24";
      if (age < 35) return "25–34";
      if (age < 45) return "35–44";
      if (age < 55) return "45–54";
      if (age < 65) return "55–64";
      return "65+";
    })
    .filter(Boolean);

  const ageGroups = ["18–24", "25–34", "35–44", "45–54", "55–64", "65+"];
  const ageData2 = ageGroups.map((g) => ({
    name: g, count: ageData.filter((a) => a === g).length,
  })).filter((d) => d.count > 0);

  const sections = [
    { title: "Top States", data: stateData },
    { title: "Age Groups", data: ageData2 },
    { title: "Political Party", data: partyData },
  ].filter((s) => s.data.length > 0);

  if (!sections.length) return null;

  return (
    <div className="mt-8">
      <h2 className="text-lg font-bold mb-4" style={{ color: NAVY, fontFamily: "Libre Baskerville, serif" }}>
        Respondent Demographics
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {sections.map((s) => (
          <div key={s.title} className="bg-white border border-gray-200 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">{s.title}</h3>
            <div className="space-y-2">
              {s.data.map((d, i) => (
                <div key={d.name} className="flex items-center gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between text-xs mb-0.5">
                      <span className="text-gray-600 truncate">{d.name}</span>
                      <span className="font-medium text-gray-700 ml-2">{pct(d.count, respondents.length)}</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-1.5 rounded-full" style={{
                        width: pct(d.count, respondents.length),
                        backgroundColor: CHART_COLORS[i % CHART_COLORS.length],
                      }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function Results() {
  const { id: surveyId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [survey, setSurvey] = useState(null);
  const [responses, setResponses] = useState([]);
  const [respondents, setRespondents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user || !surveyId) return;
    fetchData();
  }, [user, surveyId]);

  async function fetchData() {
    setLoading(true);
    setError(null);
    try {
      // Fetch the survey
      const { data: surveyData, error: surveyErr } = await supabase
        .from("surveys")
        .select("*")
        .eq("id", surveyId)
        .eq("created_by", user.id)
        .single();

      if (surveyErr) throw new Error("Survey not found or access denied.");
      setSurvey(surveyData);

      // Fetch responses
      const { data: responsesData, error: respErr } = await supabase
        .from("responses")
        .select("*")
        .eq("survey_id", surveyId);

      if (respErr) throw respErr;
      setResponses(responsesData || []);

      // Fetch respondent demographics
      if (responsesData && responsesData.length > 0) {
        const userIds = [...new Set(responsesData.map((r) => r.user_id).filter(Boolean))];
        if (userIds.length > 0) {
          const { data: usersData } = await supabase
            .from("users")
            .select("id, date_of_birth, sex, race, education, employment, income, marital_status, political_party, voter_registered, veteran_status, housing, state, city, zip_code")
            .in("id", userIds);
          setRespondents(usersData || []);
        }
      }
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to load results.");
    } finally {
      setLoading(false);
    }
  }

  function getAnswersForQuestion(questionIndex) {
    return responses
      .map((r) => {
        try {
          const answers = typeof r.answers === "string" ? JSON.parse(r.answers) : r.answers;
          return Array.isArray(answers) ? answers[questionIndex] : answers?.[questionIndex];
        } catch { return null; }
      })
      .filter((a) => a !== null && a !== undefined && a !== "");
  }

  function handleExportCSV() {
    if (!survey || !responses.length) return;
    const questions = survey.questions || [];
    const headers = ["Response ID", "Submitted At", ...questions.map((q, i) => `Q${i + 1}: ${q.text}`)];
    const rows = responses.map((r) => {
      const answers = typeof r.answers === "string" ? JSON.parse(r.answers) : r.answers || [];
      return [
        r.id,
        new Date(r.created_at).toISOString(),
        ...questions.map((_, i) => JSON.stringify(answers[i] ?? "")),
      ];
    });
    const csv = [headers, ...rows].map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${survey.title?.replace(/\s+/g, "_") || "survey"}_results.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ── Loading ──
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: CREAM }}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
            style={{ borderColor: GOLD, borderTopColor: "transparent" }} />
          <p className="text-sm text-gray-500">Loading results…</p>
        </div>
      </div>
    );
  }

  // ── Error ──
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: CREAM }}>
        <div className="text-center">
          <p className="text-gray-600 mb-3">{error}</p>
          <button onClick={() => navigate("/org/my-surveys")}
            className="text-sm font-medium underline" style={{ color: NAVY }}>
            ← Back to My Surveys
          </button>
        </div>
      </div>
    );
  }

  const questions = survey?.questions || [];
  const responseCount = responses.length;
  const targetResponses = survey?.target_responses ?? 0;
  const completionPct = targetResponses > 0 ? Math.round((responseCount / targetResponses) * 100) : null;

  const avgCompletionTime = (() => {
    const times = responses.filter((r) => r.duration_seconds).map((r) => r.duration_seconds);
    if (!times.length) return null;
    const avg = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
    return avg < 60 ? `${avg}s` : `${Math.round(avg / 60)}m ${avg % 60}s`;
  })();

  return (
    <div className="min-h-screen pb-12" style={{ backgroundColor: CREAM }}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">

        {/* Back link */}
        <button
          onClick={() => navigate("/org/my-surveys")}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-5 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          My Surveys
        </button>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: NAVY, fontFamily: "Libre Baskerville, serif" }}>
              {survey.title}
            </h1>
            {survey.description && (
              <p className="text-sm text-gray-500 mt-1">{survey.description}</p>
            )}
            <p className="text-xs text-gray-400 mt-1">Submitted {formatDate(survey.created_at)}</p>
          </div>
          <button
            onClick={handleExportCSV}
            disabled={!responseCount}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold border transition-colors whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ borderColor: NAVY, color: NAVY, backgroundColor: "white" }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export CSV
          </button>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          <StatCard
            label="Total Responses"
            value={responseCount.toLocaleString()}
            sub={targetResponses ? `of ${targetResponses.toLocaleString()} target` : undefined}
          />
          <StatCard
            label="Completion"
            value={completionPct != null ? `${completionPct}%` : "—"}
            sub={completionPct != null ? (completionPct >= 100 ? "Goal reached" : "In progress") : "No target set"}
            color={completionPct != null && completionPct >= 100 ? GREEN : NAVY}
          />
          <StatCard
            label="Questions"
            value={questions.length}
            sub={`${questions.length} question${questions.length !== 1 ? "s" : ""}`}
          />
          <StatCard
            label="Avg. Completion Time"
            value={avgCompletionTime || "—"}
            sub={avgCompletionTime ? "per response" : "Not tracked"}
          />
        </div>

        {/* Progress bar (if has target) */}
        {targetResponses > 0 && (
          <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6">
            <div className="flex justify-between items-center text-sm mb-2">
              <span className="font-medium" style={{ color: NAVY }}>Response Progress</span>
              <span className="text-gray-500">{responseCount.toLocaleString()} / {targetResponses.toLocaleString()}</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
              <div
                className="h-3 rounded-full transition-all duration-700"
                style={{
                  width: `${Math.min(completionPct, 100)}%`,
                  backgroundColor: completionPct >= 100 ? GREEN : GOLD,
                }}
              />
            </div>
            {completionPct >= 100 && (
              <p className="text-xs mt-2 font-medium" style={{ color: GREEN }}>
                ✓ Response target reached
              </p>
            )}
          </div>
        )}

        {/* No responses yet */}
        {!responseCount && (
          <div className="bg-white border border-gray-200 rounded-xl p-10 text-center mb-6">
            <div className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center" style={{ backgroundColor: CREAM }}>
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke={GOLD}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <p className="text-gray-600 font-medium">No responses yet</p>
            <p className="text-sm text-gray-400 mt-1">
              {survey.status === "pending_review"
                ? "Your survey is awaiting admin approval before going live."
                : "Results will appear here as citizens complete your survey."}
            </p>
          </div>
        )}

        {/* Question results */}
        {responseCount > 0 && questions.length > 0 && (
          <div>
            <h2 className="text-lg font-bold mb-4" style={{ color: NAVY, fontFamily: "Libre Baskerville, serif" }}>
              Question Breakdown
            </h2>
            <div className="space-y-4">
              {questions.map((q, i) => (
                <QuestionCard
                  key={q.id || i}
                  question={q}
                  index={i}
                  answers={getAnswersForQuestion(i)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Demographics */}
        {responseCount > 0 && <DemographicSection respondents={respondents} />}

      </div>
    </div>
  );
}
