import { useEffect, useState } from "react";
import ReviewCycleCard from "./ReviewCycleCard";
import CreateReviewCycleModal from "./CreateReviewCycleModal";
import {
  addReviewCycle,
  getReviewCycles,
  refreshReviewCycles,
  removeReviewCycle,
  subscribeToReviewCycles,
} from "../services/reviewcyclestorage";
import "../styles/reviewcyclesection.css";

function ReviewCycleSection() {
  const [cycles, setCycles] = useState(getReviewCycles());
  const [isModalOpen, setIsModalOpen] = useState(false);

  /* keep this section in sync if a cycle is created/deleted elsewhere */
  useEffect(() => {
    refreshReviewCycles().catch((error) =>
      console.error("Unable to load review cycles", error),
    );
    return subscribeToReviewCycles(() => setCycles(getReviewCycles()));
  }, []);

  const handleCreate = async (newCycle) => {
    try {
      await addReviewCycle(newCycle);
      setIsModalOpen(false);
    } catch (error) {
      console.error("Unable to create review cycle", error);
    }
  };

  const handleDelete = async (cycleId) => {
    try {
      await removeReviewCycle(cycleId);
    } catch (error) {
      console.error("Unable to delete review cycle", error);
    }
  };

  return (
    <section className="review-cycle-section">
      <div className="review-cycle-heading-card">Review Cycle</div>

      <div className="review-cycle-add-row">
        <button
          type="button"
          className="review-cycle-add-button"
          onClick={() => setIsModalOpen(true)}
          aria-label="Create new review cycle"
        >
          +
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
