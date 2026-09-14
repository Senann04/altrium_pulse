import { useCallback, useEffect, useMemo, useState } from "react";
import { assignPeerReviewer, loadHrReviewOperations } from "../services/workflowService";
import { completeHrReview } from "../services/reviewService";

const statusTone = {
  "Not started": "neutral",
  "Self assessment": "gold",
  "Peer feedback": "blue",
  "Supervisor review": "purple",
  "HR review": "green",
  Completed: "green",
  Reopened: "red",
};

function ReviewOperationCard({ review, onAssign, onCompleted }) {
  const [workedTogether, setWorkedTogether] = useState(false);
  const [reviewerId, setReviewerId] = useState("");
  const [dueDate, setDueDate] = useState(review.dueDate || review.cycleEndDate || "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [comments, setComments] = useState(review.hrComments || "");
  const [overallRating, setOverallRating] = useState(review.normalization?.normalized_rating ?? review.supervisorRating ?? "");
  const [completing, setCompleting] = useState(false);
  const assignedIds = new Set(review.peerRequests.map((request) => request.reviewerId));
  const reviewerOptions = review.reviewerOptions.filter((person) => !assignedIds.has(person.userId));
  const canAssign = ["not_started", "self_review", "peer_feedback", "reopened"].includes(review.statusKey);
  const normalizationReady = review.normalization?.status === "approved";
  const meetingReady = review.meeting?.status === "completed" && Boolean(review.meeting?.notes?.trim());
  const canComplete = ["hr_review", "reopened"].includes(review.statusKey) && normalizationReady && meetingReady;

  const handleAssign = async () => {
    if (!reviewerId || !workedTogether) return;
    setSubmitting(true);
    setError("");
    try {
      await onAssign(review.id, reviewerId, dueDate || null);
      setReviewerId("");
      setWorkedTogether(false);
    } catch (assignmentError) {
      setError(assignmentError.message || "Unable to assign this peer reviewer.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleComplete = async () => {
    if (!canComplete || !comments.trim() || overallRating === "") return;
    setCompleting(true);
    setError("");
    try {
      await completeHrReview(review.id, { comments, overallRating });
      await onCompleted();
    } catch (completionError) {
      setError(completionError.message || "Unable to complete this review.");
    } finally {
      setCompleting(false);
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

      <label><input type="checkbox" checked={workedTogether} disabled={!canAssign || submitting} onChange={(e) => setWorkedTogether(e.target.checked)} /> I confirm this colleague worked closely with the employee.</label>
      <div className="hr-review-assignment-row">
        <label>
          <span>Select peer reviewer</span>
          <select value={reviewerId} onChange={(event) => setReviewerId(event.target.value)} disabled={!canAssign || !reviewerOptions.length || submitting}>
            <option value="">{canAssign ? (reviewerOptions.length ? "Choose an eligible colleague" : "No additional peers available") : "Reviewer assignment is closed"}</option>
            {reviewerOptions.map((person) => (
              <option key={person.userId} value={person.userId}>{person.name} · {person.team} · {person.id}</option>
            ))}
          </select>
        </label>
        <label>
          <span>Feedback due</span>
          <input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} disabled={!canAssign || submitting} />
        </label>
        <button type="button" onClick={handleAssign} disabled={!canAssign || !reviewerId || !workedTogether || submitting}>
          {submitting ? "Assigning…" : "Assign reviewer"}
        </button>
      </div>

      <div className="hr-review-gates">
        <div className={normalizationReady ? "is-ready" : ""}><span>Normalization</span><strong>{review.normalization?.status?.replace("_", " ") || "Pending"}</strong></div>
        <div className={meetingReady ? "is-ready" : ""}><span>PAR outcome</span><strong>{meetingReady ? "Recorded" : "Required"}</strong></div>
        <div><span>Final rating</span><strong>{review.overallRating ?? review.normalization?.normalized_rating ?? "–"}</strong></div>
      </div>

      {review.statusKey === "completed" ? (
        <div className="hr-review-complete-state"><strong>Review completed</strong><span>{review.hrComments || "No HR completion note was recorded."}</span></div>
      ) : (
        <div className="hr-review-completion-row">
          <label><span>HR completion note</span><textarea value={comments} onChange={(event) => setComments(event.target.value)} disabled={!canComplete || completing} /></label>
          <label><span>Normalized rating</span><input type="number" min="0" max="5" step="0.1" value={overallRating} onChange={(event) => setOverallRating(event.target.value)} disabled={!canComplete || completing} /></label>
          <button type="button" onClick={handleComplete} disabled={!canComplete || !comments.trim() || overallRating === "" || completing}>{completing ? "Completing…" : "Complete review"}</button>
        </div>
      )}
      {error && <p className="hr-admin-inline-error" role="alert">{error}</p>}
    </article>
  );
}

function HRReviewOperations({ assignedTeams = [], assignedProjects = [] }) {
  const [reviews, setReviews] = useState([]);
  const [selectedCycle, setSelectedCycle] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
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
  const cycleReviews = reviews.filter((review) => review.cycleName === selectedCycle);
  const visibleReviews = cycleReviews.filter((review) => {
    const matchesSearch = `${review.employeeName} ${review.employeeNumber} ${review.team}`.toLowerCase().includes(search.toLowerCase());
    return matchesSearch && (statusFilter === "all" || review.statusKey === statusFilter);
  });
  const completed = cycleReviews.filter((review) => review.statusKey === "completed").length;
  const pendingPeerRequests = cycleReviews.reduce(
    (total, review) => total + review.peerRequests.filter((request) => request.status === "pending").length,
    0,
  );
  const scopeParts = [
    assignedTeams.length ? `Teams: ${assignedTeams.join(", ")}` : "",
    assignedProjects.length ? `Projects: ${assignedProjects.join(", ")}` : "",
  ].filter(Boolean);
  const cycleTeams = [...new Set(cycleReviews.map((review) => review.team))];
  const scopeLabel = cycleTeams.length ? cycleTeams.join(", ") : scopeParts.join(" · ") || "No scope assigned";
  const statuses = [...new Set(cycleReviews.map((review) => review.statusKey))];

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
          <p>Monitor reviews assigned to you for each cycle. Peer reviewers must have worked closely with the employee.</p>
        </div>
        <label>
          <span>Review cycle</span>
          <select value={selectedCycle} onChange={(event) => setSelectedCycle(event.target.value)} disabled={!cycleNames.length}>
            {cycleNames.map((cycleName) => <option key={cycleName} value={cycleName}>{cycleName}</option>)}
          </select>
        </label>
      </div>

      <div className="hr-review-operation-filters">
        <label><span>Search assigned reviews</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Employee, ID or team" /></label>
        <label><span>Status</span><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="all">All statuses</option>{statuses.map((value) => <option key={value} value={value}>{String(value).replaceAll("_", " ")}</option>)}</select></label>
      </div>

      <div className="hr-review-operations-summary">
        <div><span>Assigned teams</span><strong>{scopeLabel}</strong></div>
        <div><span>Assigned reviews</span><strong>{cycleReviews.length}</strong></div>
        <div><span>Completed</span><strong>{completed}/{cycleReviews.length}</strong></div>
        <div><span>Peer requests pending</span><strong>{pendingPeerRequests}</strong></div>
      </div>

      {loading && <p className="hr-admin-state">Loading assigned reviews…</p>}
      {error && <p className="hr-admin-state is-error" role="alert">{error}</p>}
      {!loading && !error && !visibleReviews.length && (
        <p className="hr-admin-state">No employee reviews are assigned to you for this cycle.</p>
      )}
      <div className="hr-review-operation-list">
        {visibleReviews.map((review) => (
          <ReviewOperationCard key={review.id} review={review} onAssign={handleAssign} onCompleted={refresh} />
        ))}
      </div>
    </section>
  );
}

export default HRReviewOperations;
