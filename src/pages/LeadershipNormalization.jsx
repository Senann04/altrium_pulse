import { useCallback, useEffect, useMemo, useState } from "react";
import Header from "../components/header";
import Sidebar from "../components/sidebar";
import WorkspaceHeading from "../components/WorkspaceHeading";
import {
  loadNormalizationQueue,
  saveNormalizationDecision,
} from "../services/performanceWorkflowService";
import "../styles/appshell.css";
import "../styles/performance-workflow.css";

function formatDate(value) {
  if (!value) return "Not decided";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function NormalizationCard({ review, onSaved }) {
  const [rating, setRating] = useState(review.normalized_rating ?? review.supervisor_rating ?? "");
  const [rationale, setRationale] = useState(review.rationale || "");
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  const handleDecision = async (status) => {
    if (!rationale.trim() || (status === "approved" && !rating)) return;
    setBusy(status);
    setError("");
    try {
      await saveNormalizationDecision(review.review_id, { status, rating, rationale });
      await onSaved();
    } catch (decisionError) {
      setError(decisionError.message || "Unable to save this normalization decision.");
    } finally {
      setBusy("");
    }
  };

  return (
    <article className="normalization-card">
      <header>
        <span className="workflow-person-avatar" aria-hidden="true">{review.employee_name.slice(0, 1)}</span>
        <div><strong>{review.employee_name}</strong><span>{review.employee_number} · {review.department_name}</span></div>
        <span className={`workflow-status workflow-status-${review.decision_status}`}>{review.decision_status.replaceAll("_", " ")}</span>
      </header>
      <div className="normalization-metadata">
        <div><span>Cycle</span><strong>{review.cycle_name}</strong></div>
        <div><span>Proposed rating</span><strong>{review.supervisor_rating ?? "–"}/5</strong></div>
        <div><span>Supporting evidence</span><strong>{review.evidence_count} files</strong></div>
        <div><span>Last decision</span><strong>{formatDate(review.decided_at)}</strong></div>
      </div>
      <section className="normalization-summary">
        <span>Supervisor evidence summary</span>
        <p>{review.supervisor_summary || "No supervisor summary was provided."}</p>
      </section>
      <div className="workflow-form-grid">
        <label className="workflow-field">
          <span>Normalized rating</span>
          <select value={rating} onChange={(event) => setRating(event.target.value)}>
            <option value="">Choose rating</option>
            {[1, 2, 3, 4, 5].map((value) => <option key={value} value={value}>{value} / 5</option>)}
          </select>
        </label>
        <label className="workflow-field workflow-field-wide">
          <span>Decision rationale</span>
          <textarea value={rationale} onChange={(event) => setRationale(event.target.value)} />
        </label>
      </div>
      {error && <p className="workflow-error" role="alert">{error}</p>}
      <footer className="workflow-inline-actions workflow-actions-end">
        <button type="button" onClick={() => handleDecision("changes_requested")} disabled={!rationale.trim() || Boolean(busy)}>
          {busy === "changes_requested" ? "Saving…" : "Request changes"}
        </button>
        <button type="button" className="is-primary" onClick={() => handleDecision("approved")} disabled={!rating || !rationale.trim() || Boolean(busy)}>
          {busy === "approved" ? "Approving…" : "Approve normalization"}
        </button>
      </footer>
    </article>
  );
}

function LeadershipNormalization({ onNavigate, onSignOut, profileData }) {
  const [reviews, setReviews] = useState([]);
  const [filter, setFilter] = useState("pending");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    setError("");
    try {
      setReviews(await loadNormalizationQueue());
    } catch (loadError) {
      setError(loadError.message || "Unable to load normalization work.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const initialLoad = window.setTimeout(refresh, 0);
    return () => window.clearTimeout(initialLoad);
  }, [refresh]);

  const visibleReviews = useMemo(
    () => reviews.filter((review) => filter === "all" || review.decision_status === filter),
    [reviews, filter],
  );

  return (
    <div className="app-shell">
      <Sidebar role="leadership" activeItem="normalization" onNavigate={onNavigate} onSignOut={onSignOut} profileData={profileData} />
      <main className="app-main workflow-page">
        <Header title="Normalization" profileData={profileData} />
        <WorkspaceHeading
          eyebrow="Fair review decisions"
          title="Normalization"
          description="Review the approved evidence packet, calibrate proposed ratings and record a reasoned decision without opening unrestricted private reviews."
        />
        <aside className="workflow-privacy-note">
          This queue contains only the employee identity, proposed rating, supervisor evidence summary and evidence count required for normalization.
        </aside>
        <div className="normalization-toolbar">
          <label><span>Decision status</span><select value={filter} onChange={(event) => setFilter(event.target.value)}><option value="pending">Pending</option><option value="approved">Approved</option><option value="changes_requested">Changes requested</option><option value="all">All decisions</option></select></label>
          <strong>{visibleReviews.length} reviews</strong>
        </div>
        {loading && <p className="workflow-state">Loading normalization queue…</p>}
        {error && <p className="workflow-state is-error" role="alert">{error}</p>}
        {!loading && !error && !visibleReviews.length && <p className="workflow-state">No reviews match this decision status.</p>}
        <div className="normalization-list">
          {visibleReviews.map((review) => <NormalizationCard key={`${review.review_id}-${review.decision_status}`} review={review} onSaved={refresh} />)}
        </div>
      </main>
    </div>
  );
}

export default LeadershipNormalization;
