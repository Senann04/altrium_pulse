import "../styles/reviewcyclecard.css";
/* Reusable for both HRBP and Leadership — the `cycle` prop contains all the data needed to render 
the card, so this component never needs to know which dashboard it's rendering on. */
function formatDeadline(value) {
  if (!value) return "Not set";
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" })
    .format(new Date(`${value}T00:00:00`));
}

function ReviewCycleCard({ cycle, canManage = false, busy = false, onStatusChange }) {
  const nextStatus = cycle.status === "Draft" ? "active" : cycle.status === "Active" ? "closed" : "";
  const nextLabel = nextStatus === "active" ? "Start cycle" : "Close cycle";
  return (
    <article className="review-cycle-card">
      <header className="review-cycle-card-header">
        <div>
          <span>Review cycle</span>
          <h3 className="review-cycle-name-pill">{cycle.name}</h3>
        </div>
        <span className={`review-cycle-active-label${cycle.active ? " is-active" : ""}`}>
          <i aria-hidden="true" />
          {cycle.active ? "Active" : "Inactive"}
        </span>
      </header>

      <p className="review-cycle-description">{cycle.description}</p>

      <div className="review-cycle-details-grid">
        <div className="review-cycle-window">
          <div className="review-cycle-window-heading">
            <span>Cycle window</span>
            <small>Scheduled review period</small>
          </div>
          <div className="review-cycle-window-dates">
            <div>
              <span>Opens</span>
              <strong>{cycle.startDate}</strong>
            </div>
            <div className="review-cycle-window-line" aria-hidden="true">
              <i />
            </div>
            <div>
              <span>Closes</span>
              <strong>{cycle.endDate}</strong>
            </div>
          </div>
        </div>

        <div className="review-cycle-metadata">
          <div className="review-cycle-field-box review-cycle-field-status">
            <span>Current status</span>
            <strong>{cycle.status}</strong>
          </div>
          <div className="review-cycle-field-box review-cycle-field-cadence">
            <span>Cadence</span>
            <strong>{cycle.reviewType}</strong>
          </div>
        </div>
      </div>

      <div className="review-cycle-phase-dates" aria-label="Workflow deadlines">
        <div><span>Self-assessment</span><strong>{formatDeadline(cycle.selfReviewDue)}</strong></div>
        <div><span>Peer feedback</span><strong>{formatDeadline(cycle.feedbackDue)}</strong></div>
        <div><span>Supervisor review</span><strong>{formatDeadline(cycle.supervisorReviewDue)}</strong></div>
      </div>

      <div className="review-cycle-footer">
        <span>Shared schedule · confidential records stay scoped</span>
        {canManage && nextStatus && (
          <button type="button" onClick={() => onStatusChange(cycle.id, nextStatus)} disabled={busy}>
            {busy ? "Updating…" : nextLabel}
          </button>
        )}
      </div>
    </article>
  );
}

export default ReviewCycleCard;
