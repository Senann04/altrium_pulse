import { useState } from "react";
import AssignedGoalCard from "./AssignedGoalCard";
import GoalAssignmentModal from "./GoalAssignmentModal";
import "../styles/assignedgoalsection.css";

/*Temporary prototype data until Supabase provides real PDP/PIP goal
 records and a real employee directory. Kept in this one file and passed down as props so nothing else duplicates it.*/
const employeeDirectory = [
  { id: "EM1842", name: "Tharindu Perera", team: "Engineering" },
  { id: "EM2011", name: "Nadeesha Fernando", team: "Engineering" },
  { id: "EM1503", name: "Kasun Silva", team: "Design" },
  { id: "EM1770", name: "Amaya Perera", team: "Marketing" },
];

const initialGoalsByType = {
  PDP: [
    {
      id: "pdp-1",
      type: "PDP",
      team: "Engineering",
      employeeName: "Tharindu Perera",
      employeeId: "EM1842",
      goal: "Complete advanced React certification and lead one project.",
      status: "In Progress",
      progress: 40,
      /* action item/completed pair mirrors the shape Supabase PDP/PIP
      action_items will eventually use (description + completed), so
      multiple assigned items can later feed the completed/total * 100
      formula used by GoalProgressCard.*/
      actionItem: "Finish certification module 3",
      actionItemCompleted: false,
      evidence: "",
    },
  ],
  PIP: [
    {
      id: "pip-1",
      type: "PIP",
      team: "Design",
      employeeName: "Kasun Silva",
      employeeId: "EM1503",
      goal: "Meet all sprint delivery deadlines for the current quarter.",
      status: "In Progress",
      progress: 25,
      actionItem: "Submit weekly progress report",
      actionItemCompleted: false,
      evidence: "",
    },
  ],
};

/*Reusable for both "ASSIGNED PDP GOALS" and "ASSIGNED PIP GOALS" — type
and title are passed in as props, no internal PDP/PIP branching.*/
function AssignedGoalSection({ type, title }) {
  const [goals, setGoals] = useState(initialGoalsByType[type] || []);
  const [teamFilter, setTeamFilter] = useState("All Teams");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const teams = ["All Teams", ...new Set(employeeDirectory.map((e) => e.team))];

  // Local filtering only — no backend query yet.
  const visibleGoals =
    teamFilter === "All Teams" ? goals : goals.filter((g) => g.team === teamFilter);

  /* Where a newly assigned goal is added to the visible list. This is the
  seam a future Supabase insert will replace (insert, then update/refetch). */
  const handleAssign = (newGoal) => {
    setGoals([{ ...newGoal, id: `${type.toLowerCase()}-${Date.now()}`, type }, ...goals]);
    setTeamFilter("All Teams");
    setIsModalOpen(false);
  };

  const handleUpdate = (goalId, updatedFields) => {
    setGoals(goals.map((g) => (g.id === goalId ? { ...g, ...updatedFields } : g)));
  };

  const handleDone = (goalId) => {
    setGoals(goals.map((g) => (g.id === goalId ? { ...g, status: "Completed" } : g)));
  };

  return (
    <section className="assigned-goal-section">
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
