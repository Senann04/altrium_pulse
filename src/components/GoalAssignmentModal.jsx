import { useState } from "react";
import "../styles/goalassignmentmodal.css";

/* Reusable overlay for assigning either a PDP or a PIP goal — the `type` prop tells the caller 
(AssignedGoalSection) which section is assigning, this component itself has no PDP/PIP branching. */
function GoalAssignmentModal({ type, isOpen, onClose, onAssign, employeeDirectory }) {
  const [team, setTeam] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [employeeName, setEmployeeName] = useState("");
  const [employeeUserId, setEmployeeUserId] = useState("");
  const [goalText, setGoalText] = useState("");
  const [reason, setReason] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [actionItems, setActionItems] = useState([{ title: "", dueDate: "" }]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const teams = [...new Set(employeeDirectory.map((e) => e.team))];
  const employeesInTeam = employeeDirectory.filter((e) => e.team === team);

  const handleTeamChange = (e) => {
    setTeam(e.target.value);
    setEmployeeId("");
    setEmployeeName("");
    setEmployeeUserId("");
    setError("");
  };

  const handleEmployeeChange = (e) => {
    const selected = employeeDirectory.find((emp) => emp.id === e.target.value);
    setEmployeeId(e.target.value);
    setEmployeeName(selected ? selected.name : "");
    setEmployeeUserId(selected ? selected.userId : "");
    setError("");
  };

  const actionsValid = actionItems.length > 0 && actionItems.every((item) => (
    item.title.trim() && item.dueDate && (!startDate || item.dueDate >= startDate) && (!endDate || item.dueDate <= endDate)
  ));
  const datesValid = Boolean(startDate && endDate && startDate <= endDate);
  const canAssign = Boolean(team && employeeId && employeeName && employeeUserId && goalText.trim() && reason.trim() && datesValid && actionsValid);

  const updateAction = (index, field, value) => {
    setActionItems((items) => items.map((item, itemIndex) => itemIndex === index ? { ...item, [field]: value } : item));
  };

  const handleAssign = async () => {
    if (!team || !employeeId || !employeeName || !goalText.trim()) return;
    setSubmitting(true);
    setError("");
    try {
      await onAssign({
        team,
        employeeId,
        employeeUserId,
        employeeName,
        goal: goalText.trim(),
        reason: reason.trim(),
        startDate,
        endDate,
        actionItems,
        status: "In Progress",
        progress: 0,
        actionItem: "",
        actionItemCompleted: false,
        evidence: "",
      });
      setTeam("");
      setEmployeeId("");
      setEmployeeName("");
      setEmployeeUserId("");
      setGoalText("");
      setReason("");
      setStartDate("");
      setEndDate("");
      setActionItems([{ title: "", dueDate: "" }]);
    } catch (assignmentError) {
      setError(assignmentError.message || `Unable to assign this ${type} goal.`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="goal-assignment-overlay" onClick={onClose}>
      <div className="goal-assignment-modal" onClick={(e) => e.stopPropagation()}>
        <div className="goal-assignment-header">
          <div>
            <span>Goal administration</span>
            <h2>Assign {type} goal</h2>
          </div>
          <button type="button" className="goal-assignment-close" onClick={onClose} aria-label={`Close assign ${type} goal`}>
            ×
          </button>
        </div>
        <div className="goal-assignment-field">
          <label>Team:</label>
          <select value={team} onChange={handleTeamChange}>
            <option value="" disabled>
              Select team
            </option>
            {teams.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <div className="goal-assignment-field">
          <label>Employee ID:</label>
          <select value={employeeId} onChange={handleEmployeeChange} disabled={!team}>
            <option value="" disabled>
              Select employee ID
            </option>
            {employeesInTeam.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.id}
              </option>
            ))}
          </select>
        </div>

        <div className="goal-assignment-field">
          <label>Employee Name:</label>
          <input value={employeeName} readOnly />
        </div>

        <div className="goal-assignment-field goal-assignment-goal-field">
          <label>Goal:</label>
          <textarea value={goalText} onChange={(e) => setGoalText(e.target.value)} />
        </div>

        <div className="goal-assignment-field goal-assignment-goal-field">
          <label>Reason and expected outcome:</label>
          <textarea value={reason} onChange={(e) => setReason(e.target.value)} />
        </div>

        <div className="goal-assignment-date-grid">
          <div className="goal-assignment-field">
            <label>Start date:</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div className="goal-assignment-field">
            <label>Target date:</label>
            <input type="date" min={startDate || undefined} value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
        </div>

        <fieldset className="goal-assignment-action-list">
          <legend>Action plan</legend>
          {actionItems.map((item, index) => (
            <div className="goal-assignment-action-row" key={`action-${index + 1}`}>
              <label>
                <span>Action {index + 1}</span>
                <input value={item.title} onChange={(e) => updateAction(index, "title", e.target.value)} />
              </label>
              <label>
                <span>Due date</span>
                <input type="date" min={startDate || undefined} max={endDate || undefined} value={item.dueDate} onChange={(e) => updateAction(index, "dueDate", e.target.value)} />
              </label>
              {actionItems.length > 1 && (
                <button type="button" onClick={() => setActionItems((items) => items.filter((_, itemIndex) => itemIndex !== index))} aria-label={`Remove action ${index + 1}`}>×</button>
              )}
            </div>
          ))}
          <button type="button" className="goal-assignment-add-action" onClick={() => setActionItems((items) => [...items, { title: "", dueDate: "" }])}>
            + Add action
          </button>
        </fieldset>

        <div className="goal-assignment-actions">
          {error && <p className="hr-admin-inline-error" role="alert">{error}</p>}
          <button type="button" className="goal-assignment-cancel" onClick={onClose}>Cancel</button>
          <button type="button" className="goal-assignment-button" onClick={handleAssign} disabled={!canAssign || submitting}>
            {submitting ? "Assigning…" : "Assign goal"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default GoalAssignmentModal;
