import { useCallback, useEffect, useState } from "react";
import ReviewCycleCard from "./ReviewCycleCard";
import CreateReviewCycleModal from "./CreateReviewCycleModal";
import { createReviewCycle, deleteReviewCycle, loadReviewCycles } from "../services/workflowService";
import "../styles/reviewcyclesection.css";

function ReviewCycleSection() {
  const [cycles, setCycles] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    setError("");
    try {
      setCycles(await loadReviewCycles());
    } catch (loadError) {
      setError(loadError.message || "Unable to load review cycles.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const initialLoad = window.setTimeout(refresh, 0);
    return () => window.clearTimeout(initialLoad);
  }, [refresh]);

  const handleCreate = async (newCycle) => {
    await createReviewCycle(newCycle);
    await refresh();
    setIsModalOpen(false);
  };

  const handleDelete = async (cycle) => {
    const confirmed = window.confirm(`Delete “${cycle.name}”? This cannot be undone.`);
    if (!confirmed) return;
    setError("");
    try {
      await deleteReviewCycle(cycle.id);
      await refresh();
    } catch (deleteError) {
      setError(deleteError.message || "Unable to delete this review cycle.");
    }
  };

  return (
    <section className="review-cycle-section">
      <div className="review-cycle-add-row">
        <div className="review-cycle-toolbar-copy">
          <span>Review schedule</span>
          <strong>{cycles.length} {cycles.length === 1 ? "cycle" : "cycles"} configured</strong>
        </div>
        <button
          type="button"
          className="review-cycle-add-button"
          onClick={() => setIsModalOpen(true)}
          aria-label="Create new review cycle"
        >
          <span aria-hidden="true">+</span>
          Create cycle
        </button>
      </div>

      <div className="review-cycle-list">
        {loading && <p className="hr-admin-state">Loading review cycles…</p>}
        {error && <p className="hr-admin-state is-error" role="alert">{error}</p>}
        {!loading && !error && !cycles.length && <p className="hr-admin-state">No review cycles have been configured.</p>}
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
