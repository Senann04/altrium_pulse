import { useState } from "react";
import { StarIcon } from "./InterfaceIcons";
import "../styles/employeepeerreview.css";

const categories = ["Team Work", "Communication", "Reliability", "Professionalism", "Technical Contribution"];

function EmployeePeerReview({ peerOptions = [] }) {
  const [selectedPeer, setSelectedPeer] = useState("");
  /* Temporary category ratings until the backend schema supports rating categories. */
  const [categoryRatings, setCategoryRatings] = useState({});
  const [doWell, setDoWell] = useState("");
  const [improve, setImprove] = useState("");
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const selectedPeerData = peerOptions.find((peer) => peer.id === selectedPeer);

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
        aria-label="Teammate to review"
        value={selectedPeer}
        onChange={(e) => setSelectedPeer(e.target.value)}
      >
        <option value="" disabled>Select a teammate</option>
        {peerOptions.map((p) => (
          <option key={p.id} value={p.id}>{p.name}</option>
        ))}
      </select>

      <div className="peer-review-person">
        <span className="peer-review-avatar" aria-hidden="true">
          {selectedPeerData?.name?.charAt(0) || "–"}
        </span>
        <span>
          <strong>{selectedPeerData?.name || "Choose who you are reviewing"}</strong>
          <small>{selectedPeerData?.employeeNumber || "Employee profile"}</small>
        </span>
      </div>

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
                    aria-label={`${category}: ${star} stars`}
                    aria-pressed={star <= rating}
                  >
                    <StarIcon />
                  </button>
                ))}
              </div>
              <span className="peer-review-rating-pill">{rating || "–"}/5</span>
            </div>
          );
        })}
      </div>

      <div className="peer-review-question">
        <label>1. What does this employee do well?</label>
        <textarea value={doWell} onChange={(e) => setDoWell(e.target.value)} placeholder="Share a specific strength…" />
      </div>

      <div className="peer-review-question">
        <label>2. What could they improve?</label>
        <textarea value={improve} onChange={(e) => setImprove(e.target.value)} placeholder="Share a constructive suggestion…" />
      </div>

      {error && <p className="peer-review-error">{error}</p>}

      <div className="peer-review-submit-row">
        <button type="submit" className="peer-review-submit-button">Submit review</button>
      </div>
    </form>
  );
}

export default EmployeePeerReview;
