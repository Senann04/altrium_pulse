import { useMemo, useState } from "react";
import Header from "../components/header";
import Sidebar from "../components/sidebar";
import WorkspaceHeading from "../components/WorkspaceHeading";
import { saveSupervisorReview, SELF_ASSESSMENT_QUESTIONS } from "../services/reviewService";
import "../styles/supervisorannualreviews.css";

function ReviewStatusIcon({ state }) {
  if (state === "completed" || state === "submitted") {
    return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 4 4L19 6" /></svg>;
  }
  if (state === "overdue" || state === "due") {
    return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 8v5M12 17h.01" /><path d="M10.3 3.6 2.5 17a2 2 0 0 0 1.7 3h15.6a2 2 0 0 0 1.7-3L13.7 3.6a2 2 0 0 0-3.4 0Z" /></svg>;
  }
  return <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>;
}

function ReviewEditor({ review, onSaved }) {
  const [summary, setSummary] = useState(review.supervisorSummary || "");
  const [rating, setRating] = useState(review.supervisorRating ?? "");
  const [saving, setSaving] = useState("");
  const [message, setMessage] = useState("");

  const persist = async (submit) => {
    if (!summary.trim()) {
      setMessage("Add a clear review summary before saving.");
      return;
    }
    const numericRating = Number(rating);
    if (!Number.isFinite(numericRating) || numericRating < 1 || numericRating > 5) {
      setMessage("Choose a rating from 1 to 5.");
      return;
    }

    setSaving(submit ? "submit" : "save");
    setMessage("");
    try {
      await saveSupervisorReview(review.id, { summary, rating: numericRating, submit });
      onSaved(review.id, { summary, rating: numericRating, submitted: submit });
      setMessage(submit ? "Review submitted to HR." : "Draft saved.");
    } catch (error) {
      setMessage(error.message || "Unable to save this review.");
    } finally {
      setSaving("");
    }
  };

  if (!review.canAssess) {
    return (
      <div className="annual-review-readonly">
        <span>Supervisor assessment</span>
        <p>{review.supervisorSummary || "This assessment becomes available after the employee completes the earlier review stages."}</p>
        {review.supervisorRating !== null && review.supervisorRating !== undefined && (
          <strong>{Number(review.supervisorRating).toFixed(1)} / 5</strong>
        )}
      </div>
    );
  }

  return (
    <div className="annual-review-editor">
      <div className="annual-review-editor-heading">
        <div><span>Your assessment</span><strong>Review performance against the employee’s submitted record</strong></div>
        <label>
          Rating
          <input type="number" min="1" max="5" step="0.1" value={rating} onChange={(event) => setRating(event.target.value)} />
          <small>/ 5</small>
        </label>
      </div>
      <label className="annual-review-summary-field">
        Review summary
        <textarea
          rows="5"
          value={summary}
          onChange={(event) => setSummary(event.target.value)}
          placeholder="Summarise achievements, development priorities and the evidence behind your rating."
        />
      </label>
      <div className="annual-review-editor-footer">
        <span role="status">{message}</span>
        <div>
          <button type="button" className="annual-review-secondary" disabled={Boolean(saving)} onClick={() => persist(false)}>
            {saving === "save" ? "Saving…" : "Save draft"}
          </button>
          <button type="button" className="annual-review-primary" disabled={Boolean(saving)} onClick={() => persist(true)}>
            {saving === "submit" ? "Submitting…" : "Submit to HR"}
          </button>
        </div>
      </div>
    </div>
  );
}

function SupervisorAnnualReviews({ onNavigate, onSignOut, profileData }) {
  const [reviews, setReviews] = useState(profileData?.teamAnnualReviews || []);
  const [expandedId, setExpandedId] = useState(null);
  const years = useMemo(
    () => [...new Set(reviews.map((review) => review.year))].sort((left, right) => right - left),
    [reviews],
  );
  const [selectedYear, setSelectedYear] = useState(years[0] || new Date().getFullYear());
  const visibleReviews = reviews.filter((review) => review.year === Number(selectedYear));
  const attentionCount = visibleReviews.filter((review) => ["overdue", "due", "due-soon"].includes(review.dueState.key)).length;
  const submittedCount = visibleReviews.filter((review) => ["completed", "submitted"].includes(review.dueState.key)).length;

  const handleSaved = (reviewId, values) => {
    setReviews((current) => current.map((review) => review.id === reviewId
      ? {
          ...review,
          supervisorSummary: values.summary,
          supervisorRating: values.rating,
          canAssess: values.submitted ? false : review.canAssess,
          status: values.submitted ? "HR review" : review.status,
          statusKey: values.submitted ? "hr_review" : review.statusKey,
          dueState: values.submitted ? { key: "submitted", label: "Submitted to HR", priority: 3 } : review.dueState,
        }
      : review));
  };

  return (
    <div className="app-shell">
      <Sidebar role="supervisor" activeItem="annual-reviews" onNavigate={onNavigate} onSignOut={onSignOut} profileData={profileData} />
      <main className="app-main annual-reviews-page">
        <Header title="Annual Reviews" profileData={profileData} />
        <WorkspaceHeading
          eyebrow="Team performance"
          title="Annual Reviews"
          description="Review each direct report’s yearly performance, evidence and self-assessment before submitting your assessment to HR."
          meta={`${visibleReviews.length} employee review${visibleReviews.length === 1 ? "" : "s"}`}
        />

        <section className="annual-review-toolbar" aria-label="Review year and status summary">
          <label>Review year<select value={selectedYear} onChange={(event) => setSelectedYear(event.target.value)}>{years.map((year) => <option key={year}>{year}</option>)}</select></label>
          <div><span><strong>{visibleReviews.length}</strong>Total assigned</span><span className="attention"><strong>{attentionCount}</strong>Needs attention</span><span className="submitted"><strong>{submittedCount}</strong>Submitted</span></div>
        </section>

        {visibleReviews.length ? (
          <section className="annual-review-list" aria-label={`${selectedYear} employee reviews`}>
            {visibleReviews.map((review) => {
              const isExpanded = expandedId === review.id;
              return (
                <article className={`annual-review-card state-${review.dueState.key}`} key={review.id}>
                  <button type="button" className="annual-review-card-summary" aria-expanded={isExpanded} onClick={() => setExpandedId(isExpanded ? null : review.id)}>
                    <span className="annual-review-status-icon"><ReviewStatusIcon state={review.dueState.key} /></span>
                    <span className="annual-review-person"><strong>{review.employeeName}</strong><small>{review.employeeNumber} · {review.jobTitle}</small></span>
                    <span className="annual-review-cycle"><small>{review.reviewType}</small><strong>{review.cycleName}</strong></span>
                    <span className="annual-review-deadline"><small>Supervisor deadline</small><strong>{review.dueDateLabel}</strong></span>
                    <span className={`annual-review-state ${review.dueState.key}`}>{review.dueState.label}</span>
                    <svg className={`annual-review-chevron${isExpanded ? " expanded" : ""}`} viewBox="0 0 24 24" aria-hidden="true"><path d="m7 10 5 5 5-5" /></svg>
                  </button>

                  {isExpanded && (
                    <div className="annual-review-details">
                      <div className="annual-review-evidence-strip">
                        <span><strong>{review.goalCount}</strong>Goals connected</span>
                        <span><strong>{review.evidenceCount}</strong>Evidence files</span>
                        <span><strong>{review.status}</strong>Workflow stage</span>
                      </div>
                      <div className="annual-review-self-assessment">
                        <div><span>Employee record</span><h3>Self-assessment</h3></div>
                        {review.selfAssessment.some(Boolean) ? review.selfAssessment.map((answer, index) => answer && (
                          <div className="annual-review-answer" key={SELF_ASSESSMENT_QUESTIONS[index]}>
                            <span>{String(index + 1).padStart(2, "0")}</span>
                            <div><strong>{SELF_ASSESSMENT_QUESTIONS[index]}</strong><p>{answer}</p></div>
                          </div>
                        )) : <p className="annual-review-empty-copy">The employee has not submitted a self-assessment for this cycle.</p>}
                      </div>
                      <ReviewEditor review={review} onSaved={handleSaved} />
                    </div>
                  )}
                </article>
              );
            })}
          </section>
        ) : (
          <section className="annual-review-empty">
            <span><ReviewStatusIcon state="on-track" /></span>
            <div><h2>No reviews assigned for {selectedYear}</h2><p>Eligible employees will appear automatically when HR activates an approved review cycle.</p></div>
          </section>
        )}

        <p className="annual-review-privacy-note">
          This workspace contains only direct-report performance information needed for assessment. Confidential HR notes and peer-review identities remain restricted.
        </p>
      </main>
    </div>
  );
}

export default SupervisorAnnualReviews;
