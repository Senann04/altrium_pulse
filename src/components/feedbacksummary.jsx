import "../styles/feedback.css";

/*Reusable across Employee / Supervisor / HRBP / Leadership — only the
data changes, not the structure. overallRating maps to the existing
`rating` field; categoryRatings are temporary until the backend/database
supports per-category fields.*/
function FeedbackSummary({ overallRating, categoryRatings = [] }) {
  return (
    <div className="feedback-summary-row">
      <div className="feedback-summary-heading">Feedback for Me</div>

      <div className="feedback-summary-cards">
        <div className="overall-rating-card">
          <span className="overall-rating-label">Overall rating</span>
          <div className="overall-rating-gold">{overallRating}</div>
          <div className="overall-rating-white">out of 5</div>
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
