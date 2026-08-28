import { useState } from "react";
import "../styles/employeepeerreview.css";

/* Temporary peer options until user data comes from Supabase.
   currentEmployeeId excludes the logged-in user from their own list. */
const currentEmployeeId = "EM00145";
const peerOptions = [
  { id: "EM00212", name: "Nadeesha Fernando" },
  { id: "EM00300", name: "Amaya Perera" },
  { id: "EM00089", name: "Kasun Silva" },
].filter((p) => p.id !== currentEmployeeId);

const categories = ["Team Work", "Communication", "Reliability", "Professionalism", "Technical Contribution"];

function EmployeePeerReview() {
  const [selectedPeer, setSelectedPeer] = useState("");
  /* Temporary category ratings until the backend schema supports rating categories. */
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

    if (!selectedPeer) return setError("Please select a peer to review.");
    if (categories.some((c) => !categoryRatings[c])) return setError("Please rate every category.");
    if (!doWell.trim()) return setError("Please answer what this employee does well.");
    if (!improve.trim()) return setError("Please answer what they could improve.");

    setError("");
    // Frontend-only peer review record for now — backend developer
    // will later insert this into Supabase instead.
    const review = { peerId: selectedPeer, categoryRatings, doWell, improve };
    console.log("Peer review submitted:", review);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="peer-review-card">
        <div className="peer-review-title-pill">Peer Review</div>
        <p className="peer-review-success">Peer review submitted successfully.</p>
      </div>
    );
  }

  return (
    <form className="peer-review-card" onSubmit={handleSubmit}>
      <div className="peer-review-title-pill">Peer Review</div>

      <select
        className="peer-review-select"
        value={selectedPeer}
        onChange={(e) => setSelectedPeer(e.target.value)}
      >
        <option value="" disabled>Review Your Teammate!!!</option>
        {peerOptions.map((p) => (
          <option key={p.id} value={p.id}>{p.name}</option>
        ))}
      </select>

      {/* profile picture placeholder — real image comes from Supabase later */}
      <div className="peer-review-avatar" />

      <div className="peer-review-categories">
        {categories.map((category) => {
          const rating = categoryRatings[category] || 0;
          return (
            <div className="peer-review-category-row" key={category}>
              <span className="peer-review-category-label">{category}</span>
              <div className="peer-review-stars">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    type="button"
                    key={star}
                    className={`peer-review-star${star <= rating ? " filled" : ""}`}
                    onClick={() => handleStarClick(category, star)}
                  >
                    ★
                  </button>
                ))}
              </div>
              <span className="peer-review-rating-pill" />
            </div>
          );
        })}
      </div>

      <div className="peer-review-question">
        <label>1. What does this employee do well?</label>
        <textarea value={doWell} onChange={(e) => setDoWell(e.target.value)} />
      </div>

      <div className="peer-review-question">
        <label>2. What could they improve?</label>
        <textarea value={improve} onChange={(e) => setImprove(e.target.value)} />
      </div>

      {error && <p className="peer-review-error">{error}</p>}

      <div className="peer-review-submit-row">
        <button type="submit" className="peer-review-submit-button">SUBMIT</button>
      </div>
    </form>
  );
}

export default EmployeePeerReview;