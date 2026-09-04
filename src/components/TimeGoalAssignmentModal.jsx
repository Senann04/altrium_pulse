import { useState } from "react";
import "../styles/timegoalassignmentmodal.css";

function TimeGoalAssignmentModal({ period, isOpen, onClose, onAssign, personDirectory }) {
  const [team, setTeam] = useState("");
  const [personId, setPersonId] = useState("");
  const [personName, setPersonName] = useState("");
  const [goalText, setGoalText] = useState("");

  if (!isOpen) return null;

  const teams = [...new Set(personDirectory.map((p) => p.team))];
  const peopleInTeam = personDirectory.filter((p) => p.team === team);

  const handleTeamChange = (e) => {
    setTeam(e.target.value);
    setPersonId("");
    setPersonName("");
  };

  const handlePersonChange = (e) => {
    const selected = personDirectory.find((p) => p.id === e.target.value);
    setPersonId(e.target.value);
    setPersonName(selected ? selected.name : "");
  };

  const handleAssign = () => {
    if (!team || !personId || !personName || !goalText.trim()) return;

    onAssign({
      team,
      personId,
      personName,
      targetUserId: personId,
      targetRole: personDirectory.find((p) => p.id === personId)?.role || "employee",
      goal: goalText.trim(),
      status: "Ongoing",
      progress: 0,
    });

    setTeam("");
    setPersonId("");
    setPersonName("");
    setGoalText("");
  };

  return (
    <div className="time-goal-assignment-overlay" onClick={onClose}>
      <div className="time-goal-assignment-modal" onClick={(e) => e.stopPropagation()}>
        <div className="time-goal-assignment-header">
          <div>
            <span>Goal administration</span>
            <h2>Assign {period.toLowerCase()} goal</h2>
          </div>
          <button type="button" className="time-goal-assignment-close" onClick={onClose} aria-label={`Close assign ${period} goal`}>
            ×
          </button>
        </div>
        <div className="time-goal-assignment-field">
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

        <div className="time-goal-assignment-field">
          <label>Employee/Supervisor ID:</label>
          <select value={personId} onChange={handlePersonChange} disabled={!team}>
            <option value="" disabled>
              Select ID
            </option>
            {peopleInTeam.map((p) => (
              <option key={p.id} value={p.id}>
                {p.id}
              </option>
            ))}
          </select>
        </div>

        <div className="time-goal-assignment-field">
          <label>Employee/Supervisor Name:</label>
          <input value={personName} readOnly />
        </div>

        <div className="time-goal-assignment-field time-goal-assignment-goal-field">
          <label>Goal:</label>
          <textarea value={goalText} onChange={(e) => setGoalText(e.target.value)} />
        </div>

        <div className="time-goal-assignment-actions">
          <button type="button" className="time-goal-assignment-cancel" onClick={onClose}>Cancel</button>
          <button type="button" className="time-goal-assignment-button" onClick={handleAssign}>Assign goal</button>
        </div>
      </div>
    </div>
  );
}

export default TimeGoalAssignmentModal;
