import { useEffect, useState } from "react";
import AssignedGoalCard from "./AssignedGoalCard";
import GoalAssignmentModal from "./GoalAssignmentModal";
import {
  completeDevelopmentPlan,
  createDevelopmentPlan,
  loadAssignedDevelopmentPlans,
  loadPeopleDirectory,
  updateDevelopmentPlan,
} from "../services/workflowService";
import "../styles/assignedgoalsection.css";

/*Reusable for both "ASSIGNED PDP GOALS" and "ASSIGNED PIP GOALS" — type
and title are passed in as props, no internal PDP/PIP branching.*/
function AssignedGoalSection({ type, title }) {
  const [goals, setGoals] = useState([]);
  const [employeeDirectory, setEmployeeDirectory] = useState([]);
  const [teamFilter, setTeamFilter] = useState("All Teams");
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    let active = true;
    Promise.all([
      loadAssignedDevelopmentPlans(type),
      loadPeopleDirectory({ includeSupervisors: false }),
    ])
      .then(([plans, people]) => {
        if (!active) return;
        setGoals(plans);
        setEmployeeDirectory(people);
      })
      .catch((error) => console.error("Unable to load assigned development goals", error));
    return () => {
      active = false;
    };
  }, [type]);

  const teams = ["All Teams", ...new Set(employeeDirectory.map((e) => e.team))];

  const visibleGoals =
    teamFilter === "All Teams" ? goals : goals.filter((g) => g.team === teamFilter);

  const handleAssign = async (newGoal) => {
    try {
      const saved = await createDevelopmentPlan(type, newGoal);
      setGoals((current) => [saved, ...current]);
      setTeamFilter("All Teams");
      setIsModalOpen(false);
    } catch (error) {
      console.error("Unable to assign development goal", error);
    }
  };

  const handleUpdate = async (goalId, updatedFields) => {
    try {
      await updateDevelopmentPlan(goalId, updatedFields);
      setGoals((current) =>
        current.map((goal) => (goal.id === goalId ? { ...goal, ...updatedFields } : goal)),
      );
    } catch (error) {
      console.error("Unable to update development goal", error);
    }
  };

  const handleDone = async (goalId) => {
    try {
      await completeDevelopmentPlan(goalId);
      setGoals((current) =>
        current.map((goal) =>
          goal.id === goalId ? { ...goal, status: "Completed", progress: 100 } : goal,
        ),
      );
    } catch (error) {
      console.error("Unable to complete development goal", error);
    }
  };

  return (
    <section className="assigned-goal-section">
      <div className="assigned-goal-section-header">
        <h2 className="assigned-goal-section-title">{title}</h2>
        <button
          type="button"
          className="assigned-goal-add-button"
          onClick={() => setIsModalOpen(true)}
          aria-label={`Assign new ${type} goal`}
        >
          +
        </button>
      </div>

      <div className="assigned-goal-filter-row">
        <label htmlFor={`${type}-team-filter`}>Filter by Team:</label>
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
        {visibleGoals.map((goal) => (
          <AssignedGoalCard
            key={goal.id}
            goal={goal}
            onUpdate={handleUpdate}
            onDone={handleDone}
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
