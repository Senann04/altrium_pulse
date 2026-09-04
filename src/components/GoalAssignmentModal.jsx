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

  const canAssign = Boolean(team && employeeId && employeeName && employeeUserId && goalText.trim());

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
