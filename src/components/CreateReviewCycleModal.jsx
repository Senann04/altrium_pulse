import { useState } from "react";
import "../styles/createreviewcyclemodal.css";

function CreateReviewCycleModal({ isOpen, onClose, onCreate }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reviewType, setReviewType] = useState("");
  /* Required for the cycle-to-user linkage — not in the screenshot as a
 separate field group, but needed to establish target scope per spec. */
  const [appliesTo, setAppliesTo] = useState("both");
  const canCreate = Boolean(name.trim() && description.trim() && startDate && endDate && reviewType.trim());

  if (!isOpen) return null;

  const handleCreate = () => {
    if (!name.trim() || !description.trim() || !startDate || !endDate || !reviewType.trim()) return;

    onCreate({
      name: name.trim(),
      description: description.trim(),
      startDate,
      endDate,
      reviewType: reviewType.trim(),
      status: "Pending...",
      active: true,
      appliesTo,
    });

    setName("");
    setDescription("");
    setStartDate("");
    setEndDate("");
    setReviewType("");
    setAppliesTo("both");
  };

  return (
    <div className="create-cycle-overlay" onClick={onClose}>
      <div className="create-cycle-modal" onClick={(e) => e.stopPropagation()}>
        <div className="create-cycle-header">
          <div>
            <span>Review administration</span>
            <h2 className="create-cycle-title">Create review cycle</h2>
          </div>
          <button type="button" className="create-cycle-close" onClick={onClose} aria-label="Close create review cycle">
            ×
          </button>
        </div>

        <div className="create-cycle-field">
          <label>Cycle name:</label>
          <input value={name} onChange={(e) => setName(e.target.value)} />
        </div>

        <div className="create-cycle-field">
          <label>Description:</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>

        <div className="create-cycle-date-row">
          <div className="create-cycle-field">
            <label>Start Date</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div className="create-cycle-field">
            <label>End Date</label>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
        </div>

        <div className="create-cycle-field create-cycle-type-field">
          <label>Review Type:</label>
          <input value={reviewType} onChange={(e) => setReviewType(e.target.value)} />
        </div>

        {/* Applies-to scope: required for linking the cycle to Employee/
            Supervisor "My Current Review" screens later. */}
        <div className="create-cycle-field">
          <label>Applies To:</label>
          <select value={appliesTo} onChange={(e) => setAppliesTo(e.target.value)}>
            <option value="employee">Employees</option>
            <option value="supervisor">Immediate Supervisors</option>
            <option value="both">Both</option>
          </select>
        </div>

        <div className="create-cycle-actions">
          <button type="button" className="create-cycle-cancel" onClick={onClose}>Cancel</button>
          <button type="button" className="create-cycle-button" onClick={handleCreate} disabled={!canCreate}>
            Create cycle
          </button>
        </div>
      </div>
    </div>
  );
}

export default CreateReviewCycleModal;
