import { useState } from "react";
import "../styles/assignedgoalcard.css";

function statusLabel(value) {
  return String(value || "pending").replaceAll("_", " ").replace(/^./, (character) => character.toUpperCase());
}

function AssignedGoalCard({ goal, onUpdate }) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(goal);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const agreementsPending = goal.employeeAgreementStatus === "pending" && goal.supervisorAgreementStatus === "pending";
  const canEdit = goal.status === "Pending" && agreementsPending;

  const handleEditToggle = async () => {
    if (!isEditing) {
      setDraft(goal);
      setError("");
      setIsEditing(true);
      return;
    }

    setBusy(true);
    setError("");
    try {
      await onUpdate(goal.id, draft);
      setIsEditing(false);
    } catch (updateError) {
      setError(updateError.message || "Unable to save these changes.");
    } finally {
      setBusy(false);
    }
  };

  const updateDraft = (key, value) => setDraft((current) => ({ ...current, [key]: value }));
  const progress = isEditing ? draft.progress : goal.progress;

  return (
    <article className="assigned-goal-card">
      <header className="assigned-goal-card-header">
        <div className="assigned-goal-heading">
          <span>{goal.type} development plan</span>
          <strong>{goal.employeeName}</strong>
          <small>{goal.employeeId} · {goal.team}</small>
        </div>
        <span className="assigned-goal-status">{goal.status}</span>
      </header>

      <section className="assigned-goal-objective">
        <span>Primary objective</span>
        {isEditing ? (
          <textarea value={draft.goal} onChange={(event) => updateDraft("goal", event.target.value)} />
        ) : (
          <p>{goal.goal}</p>
        )}
        {goal.reason && <small>{goal.reason}</small>}
      </section>

      <div className="assigned-goal-dates">
        <div><span>Starts</span><strong>{goal.startDate || "Not set"}</strong></div>
        <div><span>Target</span><strong>{goal.endDate || "Not set"}</strong></div>
        <div><span>Progress</span><strong>{progress}%</strong></div>
      </div>

      {isEditing && (
        <input
          type="range"
          min="0"
          max="100"
          value={progress}
          onChange={(event) => updateDraft("progress", Number(event.target.value))}
          className="assigned-goal-progress-slider"
          style={{ "--progress": `${progress}%` }}
        />
      )}

      <section className="assigned-goal-action-list">
        <div className="assigned-goal-subheading"><span>Action plan</span><strong>{goal.actionItems.length} actions</strong></div>
        {goal.actionItems.map((action, index) => (
          <div className="assigned-goal-action-item" key={action.id || index}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <div><strong>{action.title}</strong><small>Due {action.dueDate || "not set"}</small></div>
            <em>{statusLabel(action.status)}</em>
          </div>
        ))}
        {!goal.actionItems.length && <p>No action items recorded.</p>}
      </section>

      <section className="assigned-goal-agreements">
        <div><span>Employee agreement</span><strong>{statusLabel(goal.employeeAgreementStatus)}</strong></div>
        <div><span>Supervisor agreement</span><strong>{statusLabel(goal.supervisorAgreementStatus)}</strong></div>
      </section>

      <footer className="assigned-goal-footer">
        <span>{canEdit ? "Editable until either participant responds" : "Plan changes are locked after agreement starts"}</span>
        {error && <span className="hr-admin-inline-error" role="alert">{error}</span>}
        {canEdit && (
          <button type="button" className="assigned-goal-edit-button" onClick={handleEditToggle} disabled={busy}>
            {busy ? "Saving…" : isEditing ? "Save changes" : "Edit draft"}
          </button>
        )}
      </footer>
    </article>
  );
}

export default AssignedGoalCard;
