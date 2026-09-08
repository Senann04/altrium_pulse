import { useCallback, useEffect, useState } from "react";
import { loadAssignedPeerRequests, submitAssignedPeerFeedback } from "../services/performanceWorkflowService";
import "../styles/employeepeerreview.css";

function formatDate(value) {
  if (!value) return "No deadline";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}

function AssignedPeerReviewCard({ request, onSubmitted }) {
  const [rating, setRating] = useState("");
  const [strengths, setStrengths] = useState("");
  const [improvements, setImprovements] = useState("");
  const [comments, setComments] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const isPending = request.status === "pending";
  const canSubmit = isPending && rating && strengths.trim() && improvements.trim();

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    setError("");
    try {
      await submitAssignedPeerFeedback(request, { rating, strengths, improvements, comments });
      await onSubmitted();
    } catch (submissionError) {
      setError(submissionError.message || "Unable to submit this peer review.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className={`assigned-peer-card${isPending ? "" : " is-complete"}`} onSubmit={handleSubmit}>
      <header className="assigned-peer-card-header">
        <span className="assigned-peer-avatar" aria-hidden="true">
          {request.employeeName.slice(0, 1).toUpperCase()}
        </span>
        <div>
          <strong>{request.employeeName}</strong>
          <span>{request.employeeNumber} · {request.employeeJobTitle || request.cycleName}</span>
        </div>
        <span className="assigned-peer-status">{isPending ? "Awaiting feedback" : "Submitted"}</span>
      </header>

      <div className="assigned-peer-context">
        <span>{request.cycleName}</span>
        <span>Due {formatDate(request.dueDate || request.cycleEndDate)}</span>
      </div>

      {isPending ? (
        <>
          <label className="assigned-peer-field">
            <span>Overall contribution</span>
            <select value={rating} onChange={(event) => setRating(event.target.value)} required>
              <option value="">Choose rating</option>
              {[1, 2, 3, 4, 5].map((value) => (
                <option key={value} value={value}>{value} / 5</option>
              ))}
            </select>
          </label>
          <label className="assigned-peer-field">
            <span>What does this colleague do well?</span>
            <textarea value={strengths} onChange={(event) => setStrengths(event.target.value)} required />
          </label>
          <label className="assigned-peer-field">
            <span>What could they improve?</span>
            <textarea value={improvements} onChange={(event) => setImprovements(event.target.value)} required />
          </label>
          <label className="assigned-peer-field">
            <span>Additional context <small>Optional</small></span>
            <textarea value={comments} onChange={(event) => setComments(event.target.value)} />
          </label>
          {error && <p className="peer-review-error" role="alert">{error}</p>}
          <footer className="assigned-peer-footer">
            <small>Your identity is retained for HR and the supervisor, but hidden from the employee.</small>
            <button type="submit" disabled={!canSubmit || submitting}>
              {submitting ? "Submitting…" : "Submit once"}
            </button>
          </footer>
        </>
      ) : (
        <p className="assigned-peer-complete-note">
          Submitted {request.respondedAt ? formatDate(request.respondedAt.slice(0, 10)) : "successfully"}. This assignment is now locked.
        </p>
      )}
    </form>
  );
}

function EmployeePeerReview() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    setError("");
    try {
      setRequests(await loadAssignedPeerRequests());
    } catch (loadError) {
      setError(loadError.message || "Unable to load peer-review assignments.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const initialLoad = window.setTimeout(refresh, 0);
    return () => window.clearTimeout(initialLoad);
  }, [refresh]);

  return (
    <section className="peer-review-card assigned-peer-workspace">
      <div className="peer-review-title-pill">Assigned Peer Reviews</div>
      <p className="assigned-peer-intro">
        Only reviews assigned by HR appear here. Each request accepts one confidential submission.
      </p>
      {loading && <p className="assigned-peer-state">Loading assignments…</p>}
      {error && <p className="assigned-peer-state is-error" role="alert">{error}</p>}
      {!loading && !error && !requests.length && (
        <p className="assigned-peer-state">You have no peer-review assignments.</p>
      )}
      <div className="assigned-peer-list">
        {requests.map((request) => (
          <AssignedPeerReviewCard key={request.id} request={request} onSubmitted={refresh} />
        ))}
      </div>
    </section>
  );
}

export default EmployeePeerReview;
