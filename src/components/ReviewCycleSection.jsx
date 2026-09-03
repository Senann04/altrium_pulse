import { useEffect, useState } from "react";
import ReviewCycleCard from "./ReviewCycleCard";
import CreateReviewCycleModal from "./CreateReviewCycleModal";
import { getReviewCycles, saveReviewCycles, subscribeToReviewCycles } from "../services/reviewcyclestorage";
import "../styles/reviewcyclesection.css";

/* starting example cycle, only used the first time nothing is saved yet */
const initialReviewCycles = [
  {
    id: "cycle-1",
    name: "July 2026",
    description:
      "The July 2026 Review Cycle is a monthly performance evaluation period focused on assessing employee achievements, progress toward goals, skill development, and overall contributions. Managers and employees collaborate to provide feedback, identify strengths, discuss improvement areas, and set objectives for the upcoming review cycle.",
    startDate: "01 July 2026",
    endDate: "01 August 2026",
    status: "Pending...",
    reviewType: "Monthly Review",
    active: true,
    appliesTo: "both",
  },
];

function ReviewCycleSection() {
  const [cycles, setCycles] = useState(() => {
    const saved = getReviewCycles();
    return saved.length ? saved : initialReviewCycles;
  });
  const [isModalOpen, setIsModalOpen] = useState(false);

  /* keep this section in sync if a cycle is created/deleted elsewhere */
  useEffect(() => {
    return subscribeToReviewCycles(() => setCycles(getReviewCycles()));
  }, []);

  const handleCreate = (newCycle) => {
    const updated = [{ ...newCycle, id: `cycle-${Date.now()}` }, ...cycles];
    saveReviewCycles(updated);
    setCycles(updated);
    setIsModalOpen(false);
  };

  const handleDelete = (cycleId) => {
    const updated = cycles.filter((c) => c.id !== cycleId);
    saveReviewCycles(updated);
    setCycles(updated);
  };

  return (
    <section className="review-cycle-section">
      <div className="review-cycle-heading-card">
        <div><span>Performance</span><h1>Review Cycles</h1><p>Create, activate and monitor organisation review periods.</p></div>
      </div>

      <div className="review-cycle-add-row">
        <button
          type="button"
          className="review-cycle-add-button"
          onClick={() => setIsModalOpen(true)}
          aria-label="Create new review cycle"
        >
          <span aria-hidden="true">+</span> Create cycle
        </button>
      </div>

      <div className="review-cycle-list">
        {cycles.map((cycle) => (
          <ReviewCycleCard key={cycle.id} cycle={cycle} onDelete={handleDelete} />
        ))}
      </div>

      <CreateReviewCycleModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreate={handleCreate}
      />
    </section>
  );
}

export default ReviewCycleSection;
