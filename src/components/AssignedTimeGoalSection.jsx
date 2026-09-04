import { useCallback, useEffect, useState } from "react";
import AssignedTimeGoalCard from "./AssignedTimeGoalCard";
import TimeGoalAssignmentModal from "./TimeGoalAssignmentModal";
import { createTimeGoal, loadPeopleDirectory, loadTimeGoals } from "../services/workflowService";
import "../styles/assignedtimegoalsection.css";

function AssignedTimeGoalSection({ period, title }) {
  const [allGoals, setAllGoals] = useState([]);
  const [personDirectory, setPersonDirectory] = useState([]);
  const [teamFilter, setTeamFilter] = useState("All Teams");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    setError("");
    try {
      const [directory, goals] = await Promise.all([
        loadPeopleDirectory({ includeSupervisors: true, managedOnly: true }),
        loadTimeGoals(),
      ]);
      setPersonDirectory(directory);
      setAllGoals(goals);
    } catch (loadError) {
      setError(loadError.message || `Unable to load ${period.toLowerCase()} goals.`);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    const initialLoad = window.setTimeout(refresh, 0);
    return () => window.clearTimeout(initialLoad);
  }, [refresh]);

  const periodGoals = allGoals.filter((g) => g.period === period);
  const teams = ["All Teams", ...new Set(personDirectory.map((p) => p.team))];
  const visibleGoals =
    teamFilter === "All Teams" ? periodGoals : periodGoals.filter((g) => g.team === teamFilter);

  const handleAssign = async (newGoal) => {
    await createTimeGoal({ ...newGoal, period });
    await refresh();
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
        {loading && <p>Loading assigned goals…</p>}
        {error && <p className="is-error" role="alert">{error}</p>}
        {!loading && !error && visibleGoals.length === 0 && <p>No assigned time goals found within your business unit.</p>}
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
