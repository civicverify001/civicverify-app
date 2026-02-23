import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../supabaseClient";
import useAuth from "../../hooks/useAuth";

const STATUS_CONFIG = {
  pending_review: {
    label: "Pending Review",
    color: "bg-amber-100 text-amber-800 border-amber-200",
    dot: "bg-amber-500",
  },
  active: {
    label: "Active",
    color: "bg-green-100 text-green-800 border-green-200",
    dot: "bg-green-500",
  },
  completed: {
    label: "Completed",
    color: "bg-blue-100 text-blue-800 border-blue-200",
    dot: "bg-blue-500",
  },
  rejected: {
    label: "Rejected",
    color: "bg-red-100 text-red-800 border-red-200",
    dot: "bg-red-500",
  },
  draft: {
    label: "Draft",
    color: "bg-gray-100 text-gray-600 border-gray-200",
    dot: "bg-gray-400",
  },
};

const TABS = ["All", "Pending Review", "Active", "Completed", "Rejected"];

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.draft;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${cfg.color}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function ProgressBar({ value, max }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
      <div
        className="h-1.5 rounded-full transition-all duration-500"
        style={{
          width: `${pct}%`,
          backgroundColor: pct >= 100 ? "#22863A" : "#C5960C",
        }}
      />
    </div>
  );
}

function SurveyCard({ survey, onViewResults }) {
  const navigate = useNavigate();
  const responseCount = survey.response_count ?? 0;
  const targetResponses = survey.target_responses ?? 0;
  const pct =
    targetResponses > 0 ? Math.round((responseCount / targetResponses) * 100) : 0;

  const filterCount =
    survey.demographic_filters
      ? Object.keys(survey.demographic_filters).filter(
          (k) => survey.demographic_filters[k]?.length > 0
        ).length
      : 0;

  const createdDate = new Date(survey.created_at).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const estimatedCost =
    survey.estimated_cost != null
      ? `$${Number(survey.estimated_cost).toFixed(2)}`
      : "—";

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow duration-200">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <h3
            className="font-semibold text-base truncate"
            style={{ color: "#0B2545", fontFamily: "Libre Baskerville, serif" }}
          >
            {survey.title || "Untitled Survey"}
          </h3>
          {survey.description && (
            <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">
              {survey.description}
            </p>
          )}
        </div>
        <StatusBadge status={survey.status} />
      </div>

      {/* Admin rejection reason */}
      {survey.status === "rejected" && survey.rejection_reason && (
        <div className="mb-3 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          <span className="font-medium">Rejection reason: </span>
          {survey.rejection_reason}
        </div>
      )}

      {/* Progress (only for active/completed) */}
      {(survey.status === "active" || survey.status === "completed") &&
        targetResponses > 0 && (
          <div className="mb-4">
            <div className="flex justify-between items-center text-xs text-gray-500 mb-1">
              <span>Responses</span>
              <span className="font-medium" style={{ color: "#0B2545" }}>
                {responseCount.toLocaleString()} /{" "}
                {targetResponses.toLocaleString()} ({pct}%)
              </span>
            </div>
            <ProgressBar value={responseCount} max={targetResponses} />
          </div>
        )}

      {/* Meta row */}
      <div className="flex flex-wrap gap-4 text-xs text-gray-500 mb-4">
        <span className="flex items-center gap-1">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          {createdDate}
        </span>
        {targetResponses > 0 && (
          <span className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {targetResponses.toLocaleString()} target responses
          </span>
        )}
        {filterCount > 0 && (
          <span className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
            </svg>
            {filterCount} demographic filter{filterCount !== 1 ? "s" : ""}
          </span>
        )}
        {survey.estimated_cost != null && (
          <span className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Est. {estimatedCost}
          </span>
        )}
      </div>

      {/* Question count chips */}
      {survey.questions && survey.questions.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {["multiple_choice", "rating", "text", "yes_no"].map((type) => {
            const count = survey.questions.filter((q) => q.type === type).length;
            if (!count) return null;
            const labels = {
              multiple_choice: "Multiple Choice",
              rating: "Rating",
              text: "Open-ended",
              yes_no: "Yes / No",
            };
            return (
              <span
                key={type}
                className="px-2 py-0.5 text-xs rounded-full border"
                style={{
                  borderColor: "#C5960C",
                  color: "#8B6A0A",
                  backgroundColor: "#FFFBF0",
                }}
              >
                {count} {labels[type]}
              </span>
            );
          })}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <div className="flex gap-2">
          {(survey.status === "active" || survey.status === "completed") && (
            <button
              onClick={() => onViewResults(survey.id)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: "#0B2545" }}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              View Results
            </button>
          )}
          {survey.status === "rejected" && (
            <button
              onClick={() => navigate("/org/request-survey")}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
              style={{
                backgroundColor: "#F5F1EC",
                color: "#0B2545",
              }}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Resubmit
            </button>
          )}
        </div>
        <span className="text-xs text-gray-400">ID: {survey.id.slice(0, 8)}…</span>
      </div>
    </div>
  );
}

function EmptyState({ activeTab }) {
  const navigate = useNavigate();
  const messages = {
    All: "You haven't requested any surveys yet.",
    "Pending Review": "No surveys are currently under review.",
    Active: "You have no active surveys running.",
    Completed: "No completed surveys yet.",
    Rejected: "No rejected surveys.",
  };

  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
        style={{ backgroundColor: "#F5F1EC" }}
      >
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="#C5960C">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      </div>
      <p className="text-gray-600 mb-1">{messages[activeTab]}</p>
      {activeTab === "All" && (
        <p className="text-sm text-gray-400 mb-5">
          Request a survey to start collecting verified civic data.
        </p>
      )}
      {activeTab === "All" && (
        <button
          onClick={() => navigate("/org/request-survey")}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: "#C5960C" }}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Request a Survey
        </button>
      )}
    </div>
  );
}

export default function MySurveys() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!user) return;
    fetchSurveys();
  }, [user]);

  async function fetchSurveys() {
    setLoading(true);
    setError(null);
    try {
      // Fetch surveys created by this org user
      const { data, error: err } = await supabase
        .from("surveys")
        .select(
          `
          id, title, description, status, created_at,
          target_responses, estimated_cost, demographic_filters,
          rejection_reason, questions
        `
        )
        .eq("created_by", user.id)
        .order("created_at", { ascending: false });

      if (err) throw err;

      // Fetch response counts in a separate query
      const surveyIds = (data || []).map((s) => s.id);
      let responseCounts = {};

      if (surveyIds.length > 0) {
        const { data: responsesData } = await supabase
          .from("responses")
          .select("survey_id")
          .in("survey_id", surveyIds);

        if (responsesData) {
          responsesData.forEach((r) => {
            responseCounts[r.survey_id] =
              (responseCounts[r.survey_id] || 0) + 1;
          });
        }
      }

      const enriched = (data || []).map((s) => ({
        ...s,
        response_count: responseCounts[s.id] || 0,
      }));

      setSurveys(enriched);
    } catch (err) {
      console.error("Error fetching surveys:", err);
      setError("Failed to load surveys. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const tabStatusMap = {
    All: null,
    "Pending Review": "pending_review",
    Active: "active",
    Completed: "completed",
    Rejected: "rejected",
  };

  const filteredSurveys = surveys.filter((s) => {
    const statusMatch =
      !tabStatusMap[activeTab] || s.status === tabStatusMap[activeTab];
    const searchMatch =
      !searchQuery ||
      s.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return statusMatch && searchMatch;
  });

  const tabCounts = TABS.reduce((acc, tab) => {
    const statusFilter = tabStatusMap[tab];
    acc[tab] = statusFilter
      ? surveys.filter((s) => s.status === statusFilter).length
      : surveys.length;
    return acc;
  }, {});

  const handleViewResults = (surveyId) => {
    navigate(`/org/results/${surveyId}`);
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F5F1EC" }}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1
              className="text-2xl font-bold"
              style={{ color: "#0B2545", fontFamily: "Libre Baskerville, serif" }}
            >
              My Surveys
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Track and manage all your survey requests
            </p>
          </div>
          <button
            onClick={() => navigate("/org/request-survey")}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90 whitespace-nowrap"
            style={{ backgroundColor: "#C5960C" }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Survey Request
          </button>
        </div>

        {/* Search bar */}
        <div className="relative mb-4">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search surveys…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:border-transparent"
            style={{ "--tw-ring-color": "#C5960C" }}
          />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white border border-gray-200 rounded-xl p-1 mb-6 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-150 ${
                activeTab === tab
                  ? "text-white shadow-sm"
                  : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"
              }`}
              style={
                activeTab === tab ? { backgroundColor: "#0B2545" } : {}
              }
            >
              {tab}
              {tabCounts[tab] > 0 && (
                <span
                  className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                    activeTab === tab
                      ? "bg-white/20 text-white"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {tabCounts[tab]}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-3">
              <div
                className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
                style={{ borderColor: "#C5960C", borderTopColor: "transparent" }}
              />
              <p className="text-sm text-gray-500">Loading your surveys…</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
              <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-gray-600 text-sm">{error}</p>
            <button
              onClick={fetchSurveys}
              className="text-sm font-medium underline"
              style={{ color: "#0B2545" }}
            >
              Try again
            </button>
          </div>
        ) : filteredSurveys.length === 0 ? (
          <EmptyState activeTab={searchQuery ? "All" : activeTab} />
        ) : (
          <div className="grid gap-4">
            {filteredSurveys.map((survey) => (
              <SurveyCard
                key={survey.id}
                survey={survey}
                onViewResults={handleViewResults}
              />
            ))}
          </div>
        )}

        {/* Summary footer */}
        {!loading && !error && surveys.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-4 text-sm text-gray-500 justify-center">
            <span>
              {surveys.filter((s) => s.status === "active").length} active
            </span>
            <span className="text-gray-300">•</span>
            <span>
              {surveys.filter((s) => s.status === "completed").length} completed
            </span>
            <span className="text-gray-300">•</span>
            <span>
              {surveys
                .reduce((sum, s) => sum + (s.response_count || 0), 0)
                .toLocaleString()}{" "}
              total responses collected
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
