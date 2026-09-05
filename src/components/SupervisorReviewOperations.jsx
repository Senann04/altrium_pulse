import { useCallback, useEffect, useMemo, useState } from "react";
import { saveSupervisorReview } from "../services/reviewService";
import { saveParMeeting } from "../services/workflowService";
import {
  loadSupervisorReviewOperations,
  respondToPlanAgreement,
} from "../services/performanceWorkflowService";
import "../styles/performance-workflow.css";

const QUESTION_LABELS = [
  "Previous work",
  "Achievements",
  "Challenges",
  "Learning",
  "Future goals",
];

function formatDate(value) {
  if (!value) return "Not recorded";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value.length === 10 ? `${value}T00:00:00` : value));
}

function statusLabel(value) {
  return String(value || "not_started")
    .replaceAll("_", " ")
    .replace(/^./, (character) => character.toUpperCase());
}

function PlanAgreementRow({ plan, onRespond, busyPlan }) {
  const supervisorDecision = plan.supervisor_agreement_status || "pending";
  return (
    <article className="workflow-plan-row">
      <div>
        <span>{String(plan.type).toUpperCase()} · {plan.progress}%</span>
        <strong>{plan.title}</strong>
        <small>{formatDate(plan.start_date)} – {formatDate(plan.end_date)}</small>
      </div>
      <div className="workflow-agreement-statuses">
        <span>Employee: {statusLabel(plan.employee_agreement_status)}</span>
        <span>Supervisor: {statusLabel(supervisorDecision)}</span>
      </div>
      {supervisorDecision === "pending" && (
        <div className="workflow-inline-actions">
          <button type="button" onClick={() => onRespond(plan.id, "changes_requested")} disabled={busyPlan === plan.id}>
            Request changes
          </button>
          <button type="button" className="is-primary" onClick={() => onRespond(plan.id, "agreed")} disabled={busyPlan === plan.id}>
            Agree plan
          </button>
        </div>
      )}
    </article>
  );
}

function SupervisorReviewCard({ review, onRefresh }) {
  const [summary, setSummary] = useState(review.supervisorSummary);
  const [rating, setRating] = useState(review.supervisorRating);
  const [meetingDateTime, setMeetingDateTime] = useState(
    review.meeting?.scheduled_at ? new Date(review.meeting.scheduled_at).toISOString().slice(0, 16) : "",
  );
  const [meetingNotes, setMeetingNotes] = useState(review.meeting?.notes || "");
  const [busy, setBusy] = useState("");
  const [busyPlan, setBusyPlan] = useState("");
  const [error, setError] = useState("");
  const canEvaluate = ["supervisor_review", "reopened"].includes(review.status);
  const canRecordMeeting = ["hr_review", "reopened", "completed"].includes(review.status);

  const handleEvaluation = async (submit) => {
    setBusy(submit ? "submit-review" : "save-review");
    setError("");
    try {
      await saveSupervisorReview(review.id, { summary, rating, submit });
      await onRefresh();
    } catch (saveError) {
      setError(saveError.message || "Unable to save this supervisor evaluation.");
    } finally {
      setBusy("");
    }
  };

  const handleMeeting = async (complete) => {
    if (!meetingDateTime) {
      setError("Choose a meeting date and time.");
      return;
    }
    if (complete && !meetingNotes.trim()) {
      setError("Record the meeting outcome before marking it complete.");
      return;
    }
    const [date, time] = meetingDateTime.split("T");
    setBusy(complete ? "complete-meeting" : "save-meeting");
    setError("");
    try {
      await saveParMeeting(
        { date, time, notes: meetingNotes, status: complete ? "completed" : "scheduled" },
        { reviewId: review.id, employeeId: review.employeeId },
      );
      await onRefresh();
    } catch (meetingError) {
      setError(meetingError.message || "Unable to save this PAR meeting.");
    } finally {
      setBusy("");
    }
  };

  const handlePlanAgreement = async (planId, decision) => {
    setBusyPlan(planId);
    setError("");
    try {
      await respondToPlanAgreement(planId, decision);
      await onRefresh();
    } catch (agreementError) {
      setError(agreementError.message || "Unable to record the plan decision.");
    } finally {
      setBusyPlan("");
    }
  };

  return (
    <details className="workflow-review-card">
      <summary>
        <span className="workflow-person-avatar" aria-hidden="true">{review.employeeName.slice(0, 1)}</span>
        <span className="workflow-summary-person">
          <strong>{review.employeeName}</strong>
          <small>{review.employeeNumber} · {review.employeeJobTitle} · {review.team}</small>
        </span>
        <span className="workflow-cycle-label">{review.cycleName}</span>
        <span className={`workflow-status workflow-status-${review.status}`}>{statusLabel(review.status)}</span>
      </summary>

      <div className="workflow-review-body">
        <section className="workflow-section">
          <div className="workflow-section-heading">
            <div><span>Employee input</span><h3>Self-assessment</h3></div>
            <small>{review.employeeSubmittedAt ? `Submitted ${formatDate(review.employeeSubmittedAt)}` : "Not submitted"}</small>
          </div>
          <div className="workflow-answer-grid">
            {review.selfAssessment.map((answer, index) => (
              <article key={QUESTION_LABELS[index]}>
                <span>{QUESTION_LABELS[index]}</span>
                <p>{answer || "No response recorded."}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="workflow-section">
          <div className="workflow-section-heading">
            <div><span>Accountable feedback</span><h3>Assigned peer feedback</h3></div>
            <small>{review.peerFeedback.length}/{review.peerRequests.length} submitted</small>
          </div>
          <div className="workflow-feedback-list">
            {review.peerFeedback.map((feedback) => (
              <article key={feedback.id}>
                <header><strong>{feedback.reviewerName}</strong><span>{feedback.rating ?? "–"}/5</span></header>
                <p><b>Strength:</b> {feedback.strengths || "Not recorded"}</p>
                <p><b>Improve:</b> {feedback.improvements || "Not recorded"}</p>
                {feedback.comments && <p><b>Context:</b> {feedback.comments}</p>}
              </article>
            ))}
            {!review.peerFeedback.length && <p className="workflow-empty">No assigned peer feedback has been submitted.</p>}
          </div>
        </section>

        <section className="workflow-section">
          <div className="workflow-section-heading">
            <div><span>Manager assessment</span><h3>Supervisor evaluation</h3></div>
            <small>{canEvaluate ? "Ready for your evaluation" : `Available at the supervisor-review stage`}</small>
          </div>
          <div className="workflow-form-grid">
            <label className="workflow-field workflow-field-wide">
              <span>Evaluation summary</span>
              <textarea value={summary} onChange={(event) => setSummary(event.target.value)} disabled={!canEvaluate} />
            </label>
            <label className="workflow-field">
              <span>Rating</span>
              <select value={rating} onChange={(event) => setRating(event.target.value)} disabled={!canEvaluate}>
                <option value="">Choose rating</option>
                {[1, 2, 3, 4, 5].map((value) => <option key={value} value={value}>{value} / 5</option>)}
              </select>
            </label>
          </div>
          <div className="workflow-inline-actions workflow-actions-end">
            <button type="button" onClick={() => handleEvaluation(false)} disabled={!canEvaluate || !summary.trim() || !rating || Boolean(busy)}>
              {busy === "save-review" ? "Saving…" : "Save draft"}
            </button>
            <button type="button" className="is-primary" onClick={() => handleEvaluation(true)} disabled={!canEvaluate || !summary.trim() || !rating || Boolean(busy)}>
              {busy === "submit-review" ? "Submitting…" : "Submit for normalization"}
            </button>
          </div>
        </section>

        <section className="workflow-section">
          <div className="workflow-section-heading">
            <div><span>Recorded conversation</span><h3>PAR meeting outcome</h3></div>
            <small>{review.meeting ? statusLabel(review.meeting.status) : "Not scheduled"}</small>
          </div>
          <div className="workflow-form-grid">
            <label className="workflow-field">
              <span>Date and time</span>
              <input type="datetime-local" value={meetingDateTime} onChange={(event) => setMeetingDateTime(event.target.value)} disabled={!canRecordMeeting} />
            </label>
            <label className="workflow-field workflow-field-wide">
              <span>Agreed outcome and development priorities</span>
              <textarea value={meetingNotes} onChange={(event) => setMeetingNotes(event.target.value)} disabled={!canRecordMeeting} />
            </label>
          </div>
          <div className="workflow-inline-actions workflow-actions-end">
            <button type="button" onClick={() => handleMeeting(false)} disabled={!canRecordMeeting || !meetingDateTime || Boolean(busy)}>
              {busy === "save-meeting" ? "Saving…" : "Save schedule"}
            </button>
            <button type="button" className="is-primary" onClick={() => handleMeeting(true)} disabled={!canRecordMeeting || !meetingDateTime || !meetingNotes.trim() || Boolean(busy)}>
              {busy === "complete-meeting" ? "Recording…" : "Record completed meeting"}
            </button>
          </div>
        </section>

        <section className="workflow-section">
          <div className="workflow-section-heading">
            <div><span>Mutual commitment</span><h3>PDP and PIP agreement</h3></div>
            <small>{review.plans.length} linked plans</small>
          </div>
          <div className="workflow-plan-list">
            {review.plans.map((plan) => (
              <PlanAgreementRow key={plan.id} plan={plan} onRespond={handlePlanAgreement} busyPlan={busyPlan} />
            ))}
            {!review.plans.length && <p className="workflow-empty">No development plan is linked to this employee yet.</p>}
          </div>
        </section>

        <section className="workflow-section">
          <div className="workflow-section-heading">
            <div><span>Previous cycles</span><h3>Performance history</h3></div>
            <small>{review.history.length} completed records</small>
          </div>
          <div className="workflow-history-list">
            {review.history.map((item) => (
              <article key={item.id}>
                <div><strong>{item.cycle?.name || "Completed review"}</strong><span>Completed {formatDate(item.completed_at)}</span></div>
                <strong>{item.overall_rating ?? "–"}/5</strong>
                <p>{item.supervisor_summary || item.hr_comments || "No summary recorded."}</p>
              </article>
            ))}
            {!review.history.length && <p className="workflow-empty">No earlier completed review is available.</p>}
          </div>
        </section>

        {error && <p className="workflow-error" role="alert">{error}</p>}
      </div>
    </details>
  );
}

function SupervisorReviewOperations() {
  const [reviews, setReviews] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    setError("");
    try {
      setReviews(await loadSupervisorReviewOperations());
    } catch (loadError) {
      setError(loadError.message || "Unable to load team reviews.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const initialLoad = window.setTimeout(refresh, 0);
    return () => window.clearTimeout(initialLoad);
  }, [refresh]);

  const visibleReviews = useMemo(() => reviews.filter((review) => {
    const matchesSearch = `${review.employeeName} ${review.employeeNumber} ${review.cycleName}`
      .toLowerCase()
      .includes(search.toLowerCase());
    return matchesSearch && (status === "all" || review.status === status);
  }), [reviews, search, status]);
  const statuses = [...new Set(reviews.map((review) => review.status))];

  return (
    <section className="workflow-operations-panel">
      <div className="workflow-operations-heading">
        <div><span>Direct-report workflow</span><h2>Team review operations</h2><p>Evaluate assigned employees, review accountable peer input and record PAR outcomes.</p></div>
        <div className="workflow-filters">
          <label><span>Search</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Employee or cycle" /></label>
          <label><span>Status</span><select value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">All statuses</option>{statuses.map((value) => <option key={value} value={value}>{statusLabel(value)}</option>)}</select></label>
        </div>
      </div>
      {loading && <p className="workflow-state">Loading team reviews…</p>}
      {error && <p className="workflow-state is-error" role="alert">{error}</p>}
      {!loading && !error && !visibleReviews.length && <p className="workflow-state">No reviews match these filters.</p>}
      <div className="workflow-review-list">
        {visibleReviews.map((review) => (
          <SupervisorReviewCard
            key={`${review.id}-${review.status}-${review.supervisorSubmittedAt || "draft"}-${review.meeting?.status || "none"}`}
            review={review}
            onRefresh={refresh}
          />
        ))}
      </div>
    </section>
  );
}

export default SupervisorReviewOperations;
