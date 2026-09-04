import { useCallback, useEffect, useMemo, useState } from "react";
import { assignPeerReviewer, loadHrReviewOperations } from "../services/workflowService";

const statusTone = {
  "Not started": "neutral",
  "Self assessment": "gold",
  "Peer feedback": "blue",
  "Supervisor review": "purple",
  "HR review": "green",
  Completed: "green",
  Reopened: "red",
};

function ReviewOperationCard({ review, onAssign }) {
  const [reviewerId, setReviewerId] = useState("");
  const [dueDate, setDueDate] = useState(review.dueDate || review.cycleEndDate || "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const assignedIds = new Set(review.peerRequests.map((request) => request.reviewerId));
  const reviewerOptions = review.reviewerOptions.filter((person) => !assignedIds.has(person.userId));

  const handleAssign = async () => {
    if (!reviewerId) return;
    setSubmitting(true);
    setError("");
    try {
      await onAssign(review.id, reviewerId, dueDate || null);
      setReviewerId("");
    } catch (assignmentError) {
      setError(assignmentError.message || "Unable to assign this peer reviewer.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <article className="hr-review-operation-card">
      <div className="hr-review-operation-person">
        <span className="hr-review-operation-avatar" aria-hidden="true">
          {review.employeeName.slice(0, 1).toUpperCase()}
        </span>
        <div>
          <strong>{review.employeeName}</strong>
          <span>{review.employeeNumber} · {review.team}</span>
        </div>
        <span className={`hr-review-stage hr-review-stage-${statusTone[review.status] || "neutral"}`}>
          {review.status}
        </span>
      </div>

      <div className="hr-review-peer-summary">
        <span>Peer reviewers</span>
        <div>
          {review.peerRequests.map((request) => (
            <span className="hr-review-peer-chip" key={request.id}>
              <strong>{request.reviewerName}</strong>
              <small>{request.status}</small>
            </span>
          ))}
          {!review.peerRequests.length && <small>No peer reviewers assigned yet.</small>}
        </div>
      </div>

      <div className="hr-review-assignment-row">
        <label>
          <span>Select peer reviewer</span>
          <select value={reviewerId} onChange={(event) => setReviewerId(event.target.value)} disabled={!reviewerOptions.length || submitting}>
            <option value="">{reviewerOptions.length ? "Choose a teammate" : "No additional peers available"}</option>
            {reviewerOptions.map((person) => (
              <option key={person.userId} value={person.userId}>{person.name} · {person.id}</option>
            ))}
          </select>
        </label>
        <label>
          <span>Feedback due</span>
          <input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} disabled={submitting} />
        </label>
        <button type="button" onClick={handleAssign} disabled={!reviewerId || submitting}>
          {submitting ? "Assigning…" : "Assign reviewer"}
        </button>
      </div>
      {error && <p className="hr-admin-inline-error" role="alert">{error}</p>}
    </article>
  );
}

function HRReviewOperations({ scopeLabel = "Assigned business unit" }) {
  const [reviews, setReviews] = useState([]);
  const [selectedCycle, setSelectedCycle] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    setError("");
    try {
      const loaded = await loadHrReviewOperations();
      setReviews(loaded);
      setSelectedCycle((current) => {
        if (current && loaded.some((review) => review.cycleName === current)) return current;
        return loaded.find((review) => review.cycleStatus === "active")?.cycleName || loaded[0]?.cycleName || "";
      });
    } catch (loadError) {
      setError(loadError.message || "Unable to load assigned reviews.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const initialLoad = window.setTimeout(refresh, 0);
    return () => window.clearTimeout(initialLoad);
  }, [refresh]);

  const cycleNames = useMemo(() => [...new Set(reviews.map((review) => review.cycleName))], [reviews]);
  const visibleReviews = reviews.filter((review) => review.cycleName === selectedCycle);
  const completed = visibleReviews.filter((review) => review.statusKey === "completed").length;
  const pendingPeerRequests = visibleReviews.reduce(
    (total, review) => total + review.peerRequests.filter((request) => request.status === "pending").length,
    0,
  );

  const handleAssign = async (reviewId, reviewerId, dueDate) => {
    await assignPeerReviewer(reviewId, reviewerId, dueDate);
    await refresh();
  };

  return (
    <section className="hr-review-operations">
      <div className="hr-review-operations-heading">
        <div>
          <span>Assigned review scope</span>
          <h2>Completion and peer reviewers</h2>
          <p>Monitor only the employee reviews assigned to your HRBP account.</p>
        </div>
        <label>
          <span>Review cycle</span>
          <select value={selectedCycle} onChange={(event) => setSelectedCycle(event.target.value)} disabled={!cycleNames.length}>
            {cycleNames.map((cycleName) => <option key={cycleName} value={cycleName}>{cycleName}</option>)}
          </select>
        </label>
      </div>

      <div className="hr-review-operations-summary">
        <div><span>Business unit</span><strong>{scopeLabel}</strong></div>
        <div><span>Assigned reviews</span><strong>{visibleReviews.length}</strong></div>
        <div><span>Completed</span><strong>{completed}/{visibleReviews.length}</strong></div>
        <div><span>Peer requests pending</span><strong>{pendingPeerRequests}</strong></div>
      </div>

      {loading && <p className="hr-admin-state">Loading assigned reviews…</p>}
      {error && <p className="hr-admin-state is-error" role="alert">{error}</p>}
      {!loading && !error && !visibleReviews.length && (
        <p className="hr-admin-state">No employee reviews are assigned to you for this cycle.</p>
      )}
      <div className="hr-review-operation-list">
        {visibleReviews.map((review) => (
          <ReviewOperationCard key={review.id} review={review} onAssign={handleAssign} />
        ))}
      </div>
    </section>
  );
}

export default HRReviewOperations;
