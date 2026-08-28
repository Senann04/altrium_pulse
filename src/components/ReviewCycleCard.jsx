import "../styles/reviewcyclecard.css";
/* Reusable for both HRBP and Leadership — the `cycle` prop contains all the data needed to render 
the card, so this component never needs to know which dashboard it's rendering on. */
function ReviewCycleCard({ cycle, onDelete }) {
  return (
    <div className="review-cycle-card">
      <div className="review-cycle-name-pill">{cycle.name}</div>

      <div className="review-cycle-description">{cycle.description}</div>

      <div className="review-cycle-row">
        <div className="review-cycle-field-box">{cycle.startDate}</div>
        <div className="review-cycle-field-box">{cycle.endDate}</div>
      </div>

      <div className="review-cycle-row">
        <div className="review-cycle-field-box">{cycle.status}</div>
        <div className="review-cycle-field-box">{cycle.reviewType}</div>
      </div>

      <div className="review-cycle-footer">
        <span className="review-cycle-active-label">
          {cycle.active ? "Active" : "Inactive"}
        </span>
        <button
          type="button"
          className="review-cycle-delete-button"
          onClick={() => onDelete(cycle.id)}
          aria-label="Delete review cycle"
        >
          🗑
        </button>
      </div>
    </div>
  );
}

export default ReviewCycleCard;