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
        <span />
        <button type="button" className="assigned-goal-edit-button" onClick={handleEditToggle}>
          {isEditing ? "Save" : "Edit"}
        </button>
      </div>

      <div className="assigned-goal-field">
        <label>Team:</label>
        {isEditing ? (
          <input value={field("team")} onChange={(e) => updateDraft("team", e.target.value)} />
        ) : (
          <div className="assigned-goal-value">{goal.team}</div>
        )}
      </div>

      <div className="assigned-goal-field">
        <label>Employee Name:</label>
        {isEditing ? (
          <input value={field("employeeName")} onChange={(e) => updateDraft("employeeName", e.target.value)} />
        ) : (
          <div className="assigned-goal-value">{goal.employeeName}</div>
        )}
      </div>

      <div className="assigned-goal-field">
        <label>Employee ID:</label>
        {isEditing ? (
          <input value={field("employeeId")} onChange={(e) => updateDraft("employeeId", e.target.value)} />
        ) : (
          <div className="assigned-goal-value">{goal.employeeId}</div>
        )}
      </div>

      <div className="assigned-goal-field">
        <label>Goal:</label>
        {isEditing ? (
          <textarea value={field("goal")} onChange={(e) => updateDraft("goal", e.target.value)} />
        ) : (
          <div className="assigned-goal-value assigned-goal-goal-box">{goal.goal}</div>
        )}
      </div>

      <div className="assigned-goal-progress-row">
        <label>Progress</label>
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

      <div className="assigned-goal-action-row">
        <label>Action Item:</label>
        {isEditing ? (
          <input value={field("actionItem")} onChange={(e) => updateDraft("actionItem", e.target.value)} />
        ) : (
          <div className="assigned-goal-value assigned-goal-inline-value">{goal.actionItem}</div>
        )}
        <button type="button" className="assigned-goal-view-button" onClick={() => setViewing("actionItem")}>
          View
        </button>
      </div>

      <div className="assigned-goal-action-row">
        <label>Evidence:</label>
        {isEditing ? (
          <input value={field("evidence")} onChange={(e) => updateDraft("evidence", e.target.value)} />
        ) : (
          <div className="assigned-goal-value assigned-goal-inline-value">{goal.evidence}</div>
        )}
        <button type="button" className="assigned-goal-view-button" onClick={() => setViewing("evidence")}>
          View
        </button>
      </div>

      <div className="assigned-goal-footer">
        <button
          type="button"
          className="assigned-goal-done-button"
          onClick={() => onDone(goal.id)}
          disabled={isDone}
        >
          {isDone ? "Done" : "Done"}
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
