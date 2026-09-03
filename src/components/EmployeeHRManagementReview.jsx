import { useState } from "react";
import "../styles/employeehrmanagementreview.css";

/* Temporary review targets until HR/Management user data comes from Supabase. */
const hrManagementReviewTargets = [
  { id: "HRB1842", name: "R. Thiwen Sandul" },
  { id: "LMS1842", name: "Senior Leadership" },
];

const categories = ["Communication", "Reliability", "Professionalism"];

function EmployeeHRManagementReview() {
  const [selectedTarget, setSelectedTarget] = useState("");
  /* Temporary category ratings until the backend schema supports these categories. */
  const [categoryRatings, setCategoryRatings] = useState({});
  const [doWell, setDoWell] = useState("");
  const [improve, setImprove] = useState("");
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleStarClick = (category, star) => {
    setCategoryRatings((prev) => ({ ...prev, [category]: star }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!selectedTarget) return setError("Please select a target to review.");
    if (categories.some((c) => !categoryRatings[c])) return setError("Please rate every category.");
    if (!doWell.trim()) return setError("Please answer what this employee does well.");
    if (!improve.trim()) return setError("Please answer what they could improve.");

    setError("");
    // Frontend-only feedback record for now — backend developer
    // will later insert this into Supabase instead.
    const review = { targetId: selectedTarget, categoryRatings, doWell, improve };
    console.log("HR/Management review submitted:", review);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="hrmgmt-review-card">
        <div className="hrmgmt-review-title-pill">Review HR and Management</div>
        <p className="hrmgmt-review-success">Feedback submitted successfully.</p>
      </div>
    );
  }

  return (
    <form className="hrmgmt-review-card" onSubmit={handleSubmit}>
      <div className="hrmgmt-review-title-pill">Review HR and Management</div>

      <select
        className="hrmgmt-review-select"
        value={selectedTarget}
        onChange={(e) => setSelectedTarget(e.target.value)}
      >
        <option value="" disabled>Select HR or management</option>
        {hrManagementReviewTargets.map((t) => (
          <option key={t.id} value={t.id}>{t.name}</option>
        ))}
      </select>

      <div className="hrmgmt-review-categories">
        {categories.map((category) => {
          const rating = categoryRatings[category] || 0;
          return (
            <div className="hrmgmt-review-category-row" key={category}>
              <span className="hrmgmt-review-category-label">{category}</span>
              <div className="hrmgmt-review-stars">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    type="button"
                    key={star}
                    className={`hrmgmt-review-star${star <= rating ? " filled" : ""}`}
                    onClick={() => handleStarClick(category, star)}
                  >
                    ★
                  </button>
                ))}
              </div>
              <span className="hrmgmt-review-rating-pill">{rating || "–"}/5</span>
            </div>
          );
        })}
      </div>

      <div className="hrmgmt-review-question">
        <label>1. What does this employee do well?</label>
        <textarea value={doWell} onChange={(e) => setDoWell(e.target.value)} placeholder="Share a specific strength…" />
      </div>

      <div className="hrmgmt-review-question">
        <label>2. What could they improve?</label>
        <textarea value={improve} onChange={(e) => setImprove(e.target.value)} placeholder="Share a constructive suggestion…" />
      </div>

      {error && <p className="hrmgmt-review-error">{error}</p>}

      <div className="hrmgmt-review-submit-row">
        <button type="submit" className="hrmgmt-review-submit-button">Submit feedback</button>
      </div>
    </form>
  );
}

export default EmployeeHRManagementReview;
