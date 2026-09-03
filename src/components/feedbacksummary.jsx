import "../styles/feedback.css";

/*Reusable across Employee / Supervisor / HRBP / Leadership — only the
data changes, not the structure. overallRating maps to the existing
`rating` field; categoryRatings are temporary until the backend/database
supports per-category fields.*/
function FeedbackSummary({ overallRating, categoryRatings = [] }) {
  const normalizedRating = Math.max(0, Math.min(5, Number(overallRating) || 0));
  const ratingPercent = Math.round((normalizedRating / 5) * 100);
  const ratingMessage = normalizedRating >= 4 ? "Strong performance" : normalizedRating >= 3 ? "Solid performance" : "Needs attention";

  return (
    <div className="feedback-summary-row">
      <div className="feedback-summary-heading">Feedback for Me</div>

      <div className="feedback-summary-cards">
        <div className="overall-rating-card">
          <span className="overall-rating-label">Overall rating</span>
          <div
            className="overall-rating-ring"
            role="img"
            aria-label={`${normalizedRating} out of 5`}
            style={{ "--rating-progress": `${ratingPercent}%` }}
          >
            <div>
              <strong>{normalizedRating}</strong>
              <span>out of 5</span>
            </div>
          </div>
          <div className="overall-rating-caption">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m8 12.5 2.6 2.6L16.5 9" /><circle cx="12" cy="12" r="8.5" /></svg>
            <span>{ratingMessage}</span>
          </div>
        </div>

        <div className="summary-card">
          <div className="feedback-title-pill summary-title">Performance summary</div>

          {categoryRatings.map((category) => (
            <div className="summary-row" key={category.name}>
              <span className="summary-row-label">{category.name}</span>
              <div className="summary-row-bar-wrap">
                <div className="summary-row-track">
                  <div
                    className="summary-row-fill"
                    style={{ width: `${category.value}%` }}
                  />
                </div>
                <span className="summary-row-value">{category.value}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default FeedbackSummary;
