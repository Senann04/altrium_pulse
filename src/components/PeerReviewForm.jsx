import { useState } from "react";
import "../styles/feedback.css";

/* Reusable Peer Review form for every review type (employee-peer,
supervisor-team-member, supervisor-peer-supervisor, leadership-supervisor).
All role-specific differences are supplied via props — no branching
logic for review type lives inside this component.*/

function PeerReviewForm({
  title = "Peer Review",
  dropdownLabel = "Review Your Teammate!!!",
  targets = [],
  categories = [],
  wellQuestion = "What does this employee do well?",
  improveQuestion = "What could they improve?",
}) {
  const [selectedTargetId, setSelectedTargetId] = useState("");
  const [ratings, setRatings] = useState({});
  const [wellText, setWellText] = useState("");
  const [improveText, setImproveText] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const selectedTarget = targets.find((t) => String(t.id) === String(selectedTargetId));

  // Selecting a different person resets ratings for the new target.
  const handleTargetChange = (e) => {
    setSelectedTargetId(e.target.value);
    setRatings({});
    setWellText("");
    setImproveText("");
    setSubmitted(false);
  };

  /* A star is only selectable if it continues the sequence from the
 current rating (1 -> 2 -> 3 -> 4 -> 5), or reduces to an already-filled star.*/
  const handleStarClick = (category, starIndex) => {
    const current = ratings[category] || 0;
    if (starIndex <= current + 1) {
      setRatings({ ...ratings, [category]: starIndex });
    }
  };

  // Temporary frontend submission handler until Supabase integration is connected.
  const handleSubmit = (e) => {
    e.preventDefault();
    /* Backend developer: replace with a real Supabase submission using
     { targetId: selectedTargetId, ratings, wellText, improveText }.
     Category-specific ratings are frontend-only for now — the Feedback
     table only stores rating/strengths/improvements/comments, so this
     will need schema support to persist per-category values.*/
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 2000);
  };

  return (
    <form className="peer-review-form" onSubmit={handleSubmit}>
      <div className="feedback-title-pill">{title}</div>

      <select
        className="peer-review-dropdown"
        value={selectedTargetId}
        onChange={handleTargetChange}
      >
        <option value="" disabled>
          {dropdownLabel}
        </option>
        {targets.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name}
          </option>
        ))}
      </select>

      <div
        className="peer-review-profile-placeholder"
        aria-label={selectedTarget ? selectedTarget.name : "No target selected"}
      />

      <div className="peer-review-ratings">
        {categories.map((category) => {
          const rating = ratings[category] || 0;
          return (
            <div className="peer-review-rating-row" key={category}>
              <span className="peer-review-rating-label">{category}</span>
              <div className="peer-review-stars">
                {[1, 2, 3, 4, 5].map((starIndex) => (
                  <button
                    type="button"
                    key={starIndex}
                    className={`peer-review-star${starIndex <= rating ? " filled" : ""}`}
                    onClick={() => handleStarClick(category, starIndex)}
                    disabled={starIndex > rating + 1}
                    aria-label={`${category} ${starIndex} star`}
                  >
                    ★
                  </button>
                ))}
              </div>
              <span className="peer-review-rating-value">{rating}/5</span>
            </div>
          );
        })}
      </div>

      <div className="peer-review-question">
        <label htmlFor="peer-review-well">1. {wellQuestion}</label>
        <textarea id="peer-review-well" value={wellText} onChange={(e) => setWellText(e.target.value)} />
      </div>

      <div className="peer-review-question">
        <label htmlFor="peer-review-improve">2. {improveQuestion}</label>
        <textarea id="peer-review-improve" value={improveText} onChange={(e) => setImproveText(e.target.value)} />
      </div>

      <div className="peer-review-submit-row">
        <button type="submit" className="feedback-submit-button">
          SUBMIT
        </button>
        {submitted && <span className="feedback-submitted-note">Submitted</span>}
      </div>
    </form>
  );
}

export default PeerReviewForm;