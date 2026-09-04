import { useState } from "react";
import "../styles/assignedgoalcard.css";

/* Reusable for both PDP and PIP goal cards — renders whatever goal object it receives, no type-specific branching.*/
function AssignedGoalCard({ goal, onUpdate, onDone }) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(goal);
  const [viewing, setViewing] = useState(null); // "actionItem" | "evidence" | null

  const isDone = goal.status === "Completed";

  const handleEditToggle = () => {
    if (isEditing) {
      onUpdate(goal.id, draft);
    } else {
      setDraft(goal);
    }
    setIsEditing(!isEditing);
  };

  const field = (key) => (isEditing ? draft[key] : goal[key]);
  const updateDraft = (key, value) => setDraft({ ...draft, [key]: value });

  return (
    <div className={`assigned-goal-card${isDone ? " done" : ""}`}>
      <div className="assigned-goal-card-header">
        <div className="assigned-goal-heading">
          <span>{goal.type} development plan</span>
          <strong>{goal.employeeName}</strong>
        </div>
        <span className="assigned-goal-status">{goal.status}</span>
      </div>

      <div className="assigned-goal-meta-grid">
        <div className="assigned-goal-meta">
          <span>Team</span>
          {isEditing ? (
            <input value={field("team")} onChange={(e) => updateDraft("team", e.target.value)} />
          ) : (
            <strong>{goal.team}</strong>
          )}
        </div>
        <div className="assigned-goal-meta">
          <span>Employee</span>
          {isEditing ? (
            <input value={field("employeeName")} onChange={(e) => updateDraft("employeeName", e.target.value)} />
          ) : (
            <strong>{goal.employeeName}</strong>
          )}
        </div>
        <div className="assigned-goal-meta">
          <span>Employee ID</span>
          {isEditing ? (
            <input value={field("employeeId")} onChange={(e) => updateDraft("employeeId", e.target.value)} />
          ) : (
            <strong>{goal.employeeId}</strong>
          )}
        </div>
      </div>

      <div className="assigned-goal-objective">
        <span>Primary objective</span>
        {isEditing ? (
          <textarea value={field("goal")} onChange={(e) => updateDraft("goal", e.target.value)} />
        ) : (
          <p>{goal.goal}</p>
        )}
      </div>

      <div className="assigned-goal-progress-panel">
        <div className="assigned-goal-progress-heading">
          <div>
            <span>Plan progress</span>
            <small>Current completion level</small>
          </div>
          <strong>{field("progress")}%</strong>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          value={field("progress")}
          disabled={!isEditing}
          onChange={(e) => updateDraft("progress", Number(e.target.value))}
          className="assigned-goal-progress-slider"
          style={{ "--progress": `${field("progress")}%` }}
        />
      </div>

      <div className="assigned-goal-action-grid">
        <div className="assigned-goal-action-card">
          <div>
            <span>Next action</span>
            {isEditing ? (
              <input value={field("actionItem")} onChange={(e) => updateDraft("actionItem", e.target.value)} />
            ) : (
              <strong>{goal.actionItem}</strong>
            )}
          </div>
          <button type="button" className="assigned-goal-view-button" onClick={() => setViewing("actionItem")}>
            View details
          </button>
        </div>

        <div className="assigned-goal-action-card assigned-goal-evidence-card">
          <div>
            <span>Evidence</span>
            {isEditing ? (
              <input value={field("evidence")} onChange={(e) => updateDraft("evidence", e.target.value)} />
            ) : (
              <strong>{goal.evidence || "No evidence submitted"}</strong>
            )}
          </div>
          <button type="button" className="assigned-goal-view-button" onClick={() => setViewing("evidence")}>
            View details
          </button>
        </div>
      </div>

      <div className="assigned-goal-footer">
        <button type="button" className="assigned-goal-edit-button" onClick={handleEditToggle}>
          {isEditing ? "Save changes" : "Edit details"}
        </button>
        <button
          type="button"
          className="assigned-goal-done-button"
          onClick={() => onDone(goal.id)}
          disabled={isDone}
        >
          {isDone ? "Completed" : "Mark complete"}
        </button>
      </div>

      {viewing && (
        <div className="assigned-goal-view-popup" onClick={() => setViewing(null)}>
          <div className="assigned-goal-view-popup-content" onClick={(e) => e.stopPropagation()}>
            <strong>{viewing === "actionItem" ? "Action Item" : "Evidence"}</strong>
            <p>{goal[viewing] || "Nothing recorded yet."}</p>
            <button type="button" onClick={() => setViewing(null)}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default AssignedGoalCard;
