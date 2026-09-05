import { useCallback, useEffect, useState } from "react";
import CycleHRAllocation from "./CycleHRAllocation";
import { Fragment } from "react";
import ReviewCycleCard from "./ReviewCycleCard";
import CreateReviewCycleModal from "./CreateReviewCycleModal";
import { createReviewCycle, loadReviewCycles, setReviewCycleStatus } from "../services/workflowService";
import "../styles/reviewcyclesection.css";

function ReviewCycleSection({ canManage = false }) {
  const [cycles, setCycles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [changingCycleId, setChangingCycleId] = useState("");

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

  const handleCreate = async (cycle) => {
    await createReviewCycle(cycle);
    await refresh();
    setModalOpen(false);
  };

  const handleStatusChange = async (cycleId, status) => {
    setChangingCycleId(cycleId);
    setError("");
    try {
      await setReviewCycleStatus(cycleId, status);
      await refresh();
    } catch (statusError) {
      setError(statusError.message || "Unable to update this review cycle.");
    } finally {
      setChangingCycleId("");
    }
  };

  return (
    <section className="review-cycle-section">
      <div className="review-cycle-add-row">
        <div className="review-cycle-toolbar-copy">
          <span>Company review schedule</span>
          <strong>{cycles.length} {cycles.length === 1 ? "cycle" : "cycles"} visible</strong>
          <small>Cycle dates are shared company-wide. Employee records remain limited to your assigned teams and projects.</small>
        </div>
        {canManage && (
          <button type="button" className="review-cycle-create-button" onClick={() => setModalOpen(true)}>
            <span aria-hidden="true">+</span> Create cycle
          </button>
        )}
      </div>

      <div className="review-cycle-list">
        {loading && <p className="hr-admin-state">Loading review cycles…</p>}
        {error && <p className="hr-admin-state is-error" role="alert">{error}</p>}
        {!loading && !error && !cycles.length && <p className="hr-admin-state">No review cycles have been configured.</p>}
        {cycles.map((cycle) => (
          <Fragment key={cycle.id}>
          <ReviewCycleCard
            cycle={cycle}
            canManage={canManage}
            busy={changingCycleId === cycle.id}
            onStatusChange={handleStatusChange}
          />
          <CycleHRAllocation cycle={cycle} />
          </Fragment>
        ))}
      </div>
      <CreateReviewCycleModal isOpen={modalOpen} onClose={() => setModalOpen(false)} onCreate={handleCreate} />
    </section>
  );
}

export default ReviewCycleSection;
