import { useState } from "react";
import "../styles/goalassignmentmodal.css";

/* Reusable overlay for assigning either a PDP or a PIP goal — the `type` prop tells the caller 
(AssignedGoalSection) which section is assigning, this component itself has no PDP/PIP branching. */
function GoalAssignmentModal({ isOpen, onClose, onAssign, employeeDirectory }) {
  const [team, setTeam] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [employeeName, setEmployeeName] = useState("");
  const [goalText, setGoalText] = useState("");

  if (!isOpen) return null;

  const teams = [...new Set(employeeDirectory.map((e) => e.team))];
  const employeesInTeam = employeeDirectory.filter((e) => e.team === team);

  const handleTeamChange = (e) => {
    setTeam(e.target.value);
    setEmployeeId("");
    setEmployeeName("");
  };

  const handleEmployeeChange = (e) => {
    const selected = employeeDirectory.find((emp) => emp.id === e.target.value);
    setEmployeeId(e.target.value);
    setEmployeeName(selected ? selected.name : "");
  };

  const handleAssign = () => {
    if (!team || !employeeId || !employeeName || !goalText.trim()) return;

    /* Temporary local assignment — backend developer replaces this with
    a Supabase insert into the PDP/PIP table, then calls onAssign with
     the returned record (or refetches) instead of building it locally. */
    onAssign({
      team,
      employeeId,
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
    setGoalText("");
  };

  return (
    <div className="goal-assignment-overlay" onClick={onClose}>
      <div className="goal-assignment-modal" onClick={(e) => e.stopPropagation()}>
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

        <button type="button" className="goal-assignment-button" onClick={handleAssign}>
          ASSIGN
        </button>
      </div>
    </div>
  );
}

export default GoalAssignmentModal;
