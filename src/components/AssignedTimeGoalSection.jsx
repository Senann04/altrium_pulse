import { useEffect, useState } from "react";
import AssignedTimeGoalCard from "./AssignedTimeGoalCard";
import TimeGoalAssignmentModal from "./TimeGoalAssignmentModal";
import {
  getAssignedTimeGoals,
  addAssignedTimeGoal,
  refreshAssignedTimeGoals,
  subscribeToAssignedTimeGoals,
} from "../services/assignedTimeGoalsStorage";
import { loadPeopleDirectory } from "../services/workflowService";
import "../styles/assignedtimegoalsection.css";

function AssignedTimeGoalSection({ period, title }) {
  const [allGoals, setAllGoals] = useState(getAssignedTimeGoals());
  const [personDirectory, setPersonDirectory] = useState([]);
  const [teamFilter, setTeamFilter] = useState("All Teams");
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    refreshAssignedTimeGoals().catch((error) =>
      console.error("Unable to load assigned time goals", error),
    );
    loadPeopleDirectory().then(setPersonDirectory).catch((error) =>
      console.error("Unable to load employee directory", error),
    );
    return subscribeToAssignedTimeGoals(() => setAllGoals(getAssignedTimeGoals()));
  }, []);

  const periodGoals = allGoals.filter((g) => g.period === period);
  const teams = ["All Teams", ...new Set(personDirectory.map((p) => p.team))];
  const visibleGoals =
    teamFilter === "All Teams" ? periodGoals : periodGoals.filter((g) => g.team === teamFilter);

  const handleAssign = async (newGoal) => {
    try {
      await addAssignedTimeGoal({ ...newGoal, period });
      setIsModalOpen(false);
    } catch (error) {
      console.error("Unable to assign time goal", error);
    }
  };

  return (
    <section className="assigned-time-goal-section">
      <div className="assigned-time-goal-header">
        <h2 className="assigned-time-goal-title">{title}</h2>
        <button
          type="button"
          className="assigned-time-goal-add-button"
          onClick={() => setIsModalOpen(true)}
          aria-label={`Assign new ${period} goal`}
        >
          +
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
