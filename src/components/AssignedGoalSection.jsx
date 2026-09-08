import { useCallback, useEffect, useState } from "react";
import AssignedGoalCard from "./AssignedGoalCard";
import GoalAssignmentModal from "./GoalAssignmentModal";
import {
  createDevelopmentPlan,
  loadAssignedDevelopmentPlans,
  loadPeopleDirectory,
  updateDevelopmentPlan,
} from "../services/workflowService";
import "../styles/assignedgoalsection.css";

function AssignedGoalSection({ type, title }) {
  const [goals, setGoals] = useState([]);
  const [employeeDirectory, setEmployeeDirectory] = useState([]);
  const [teamFilter, setTeamFilter] = useState("All assigned teams");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const teams = ["All assigned teams", ...new Set(employeeDirectory.map((e) => e.team))];

  // Local filtering only — no backend query yet.
  const visibleGoals =
    teamFilter === "All assigned teams" ? goals : goals.filter((g) => g.team === teamFilter);

  const refresh = useCallback(async () => {
    setError("");
    try {
      const [directory, assignedGoals] = await Promise.all([
        loadPeopleDirectory({ includeSupervisors: false, managedOnly: true }),
        loadAssignedDevelopmentPlans(type),
      ]);
      setEmployeeDirectory(directory);
      setGoals(assignedGoals);
    } catch (loadError) {
      setError(loadError.message || `Unable to load ${type} goals.`);
    } finally {
      setLoading(false);
    }
  }, [type]);

  useEffect(() => {
    const initialLoad = window.setTimeout(refresh, 0);
    return () => window.clearTimeout(initialLoad);
  }, [refresh]);

  const handleAssign = async (newGoal) => {
    await createDevelopmentPlan(type, newGoal);
    await refresh();
    setTeamFilter("All assigned teams");
    setIsModalOpen(false);
  };

  const handleUpdate = async (goalId, updatedFields) => {
    await updateDevelopmentPlan(goalId, updatedFields);
    await refresh();
  };

  return (
    <section className={`assigned-goal-section assigned-goal-section-${type.toLowerCase()}`}>
      <div className="assigned-goal-section-header">
        <div>
          <span className="assigned-goal-section-kicker">{type} plan</span>
          <h2 className="assigned-goal-section-title">{title}</h2>
        </div>
        <button
          type="button"
          className="assigned-goal-add-button"
          onClick={() => setIsModalOpen(true)}
          aria-label={`Assign new ${type} goal`}
        >
          <span aria-hidden="true">+</span>
          Assign {type}
        </button>
      </div>

      <div className="assigned-goal-filter-row">
        <label htmlFor={`${type}-team-filter`}>Assigned team:</label>
        <select
          id={`${type}-team-filter`}
          className="assigned-goal-filter-select"
          value={teamFilter}
          onChange={(e) => setTeamFilter(e.target.value)}
        >
          {teams.map((team) => (
            <option key={team} value={team}>
              {team}
            </option>
          ))}
        </select>
      </div>

      <div className="assigned-goal-card-list">
        {loading && <p className="hr-admin-state">Loading assigned {type} goals…</p>}
        {error && <p className="hr-admin-state is-error" role="alert">{error}</p>}
        {!loading && !error && !visibleGoals.length && (
          <p className="hr-admin-state">No {type} goals are assigned within your assigned teams.</p>
        )}
        {visibleGoals.map((goal) => (
          <AssignedGoalCard
            key={goal.id}
            goal={goal}
            onUpdate={handleUpdate}
          />
        ))}
      </div>

      <GoalAssignmentModal
        type={type}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAssign={handleAssign}
        employeeDirectory={employeeDirectory}
      />
    </section>
  );
}

export default AssignedGoalSection;
