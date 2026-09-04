import { useEffect, useState } from "react";
import AssignedTimeGoalCard from "./AssignedTimeGoalCard";
import TimeGoalAssignmentModal from "./TimeGoalAssignmentModal";
import {
  getAssignedTimeGoals,
  addAssignedTimeGoal,
  subscribeToAssignedTimeGoals,
} from "../services/assignedTimeGoalsStorage";
import "../styles/assignedtimegoalsection.css";

/* Temporary directory until Supabase provides real team/person data. */
const personDirectory = [
  { id: "EM00145", name: "S. Supun Kalhara", team: "Team 07", role: "employee" },
  { id: "EM00212", name: "Nadeesha Fernando", team: "Team 07", role: "employee" },
  { id: "IMS00089", name: "Kasun Silva", team: "Team 03", role: "supervisor" },
  { id: "EM00300", name: "Amaya Perera", team: "Team 03", role: "employee" },
];

function AssignedTimeGoalSection({ period, title }) {
  const [allGoals, setAllGoals] = useState(getAssignedTimeGoals());
  const [teamFilter, setTeamFilter] = useState("All Teams");
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    return subscribeToAssignedTimeGoals(() => setAllGoals(getAssignedTimeGoals()));
  }, []);

  const periodGoals = allGoals.filter((g) => g.period === period);
  const teams = ["All Teams", ...new Set(personDirectory.map((p) => p.team))];
  const visibleGoals =
    teamFilter === "All Teams" ? periodGoals : periodGoals.filter((g) => g.team === teamFilter);

  const handleAssign = (newGoal) => {
    addAssignedTimeGoal({ ...newGoal, id: `${period.toLowerCase()}-${Date.now()}`, period });
    setIsModalOpen(false);
  };

  return (
    <section className="assigned-time-goal-section">
      <div className="assigned-time-goal-header">
        <div>
          <span className="assigned-time-goal-kicker">{period} schedule</span>
          <h2 className="assigned-time-goal-title">{title}</h2>
        </div>
        <button
          type="button"
          className="assigned-time-goal-add-button"
          onClick={() => setIsModalOpen(true)}
          aria-label={`Assign new ${period} goal`}
        >
          <span aria-hidden="true">+</span>
          Assign goal
        </button>
      </div>

      <div className="assigned-time-goal-filter-row">
        <label htmlFor={`${period}-team-filter`}>Filter by Team:</label>
        <select
          id={`${period}-team-filter`}
          className="assigned-time-goal-filter-select"
          value={teamFilter}
          onChange={(e) => setTeamFilter(e.target.value)}
        >
          {teams.map((team) => (
            <option key={team} value={team}>{team}</option>
          ))}
        </select>
      </div>

      <div className="assigned-time-goal-card-grid">
        {visibleGoals.length === 0 && <p>No assigned time goals found.</p>}
        {visibleGoals.map((goal) => (
          <AssignedTimeGoalCard key={goal.id} goal={goal} />
        ))}
      </div>

      <TimeGoalAssignmentModal
        period={period}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAssign={handleAssign}
        personDirectory={personDirectory}
      />
    </section>
  );
}

export default AssignedTimeGoalSection;
