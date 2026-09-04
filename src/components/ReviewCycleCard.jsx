import "../styles/reviewcyclecard.css";
import { TrashIcon } from "./InterfaceIcons";
/* Reusable for both HRBP and Leadership — the `cycle` prop contains all the data needed to render 
the card, so this component never needs to know which dashboard it's rendering on. */
function ReviewCycleCard({ cycle, onDelete }) {
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

      <div className="review-cycle-metadata">
        <div className="review-cycle-field-box">
          <span>Start date</span>
          <strong>{cycle.startDate}</strong>
        </div>
        <div className="review-cycle-field-box">
          <span>End date</span>
          <strong>{cycle.endDate}</strong>
        </div>
        <div className="review-cycle-field-box">
          <span>Status</span>
          <strong>{cycle.status}</strong>
        </div>
        <div className="review-cycle-field-box">
          <span>Cadence</span>
          <strong>{cycle.reviewType}</strong>
        </div>
      </div>

      <div className="review-cycle-footer">
        <span>Created for organisation-wide performance reviews</span>
        <button
          type="button"
          className="review-cycle-delete-button"
          onClick={() => onDelete(cycle.id)}
          aria-label="Delete review cycle"
        >
          <TrashIcon />
          <span>Delete</span>
        </button>
      </div>
    </article>
  );
}

export default ReviewCycleCard;
