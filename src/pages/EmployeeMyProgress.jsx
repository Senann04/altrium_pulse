import { useEffect, useState } from "react";
import Sidebar from "../components/sidebar.jsx";
import Header from "../components/header.jsx";
import AssignedGoalRow from "../components/AssignedGoalRow.jsx";
import EmployeeDevelopmentGoals, { employeeDevelopmentPlans } from "../components/EmployeeDevelopmentGoals.jsx";
import GoalEvidenceSubmission from "../components/GoalEvidenceSubmission.jsx";
import { getAssignedTimeGoals, subscribeToAssignedTimeGoals } from "../services/assignedTimeGoalsStorage.js";
import "../styles/employeemyprogress.css";

/* temporary current-user identity until Supabase Auth/profile is connected */
const currentEmployee = { id: "EM00145", name: "S. Supun Kalhara" };

function EmployeeMyProgress({ onNavigate }) {
  const [timeGoals, setTimeGoals] = useState(getAssignedTimeGoals());
  /* local PDP/PIP state so clicking a goal can update its progress */
  const [pdpGoals, setPdpGoals] = useState(employeeDevelopmentPlans.PDP);
  const [pipGoals, setPipGoals] = useState(employeeDevelopmentPlans.PIP);
  const [selectedGoal, setSelectedGoal] = useState(null);

  useEffect(() => {
    return subscribeToAssignedTimeGoals(() => setTimeGoals(getAssignedTimeGoals()));
  }, []);

  const mine = timeGoals.filter(
    (g) => g.targetRole === "employee" && g.targetUserId === currentEmployee.id
  );
  const weekly = mine.filter((g) => g.period === "Weekly");
  const monthly = mine.filter((g) => g.period === "Monthly");
  const yearly = mine.filter((g) => g.period === "Yearly");

  /* marks the submitted goal completed — average/completed counts recalc automatically */
  const handleEvidenceSubmitted = (goalId) => {
    const markComplete = (goals) =>
      goals.map((g) => (g.id === goalId ? { ...g, status: "Completed", progress: 100 } : g));

    setPdpGoals((prev) => markComplete(prev));
    setPipGoals((prev) => markComplete(prev));
  };

  return (
    <div className="employee-progress-layout">
      <Sidebar role="employee" activeItem="progress" onNavigate={onNavigate} />

      <div className="employee-progress-main">
        <Header />

        <div className="employee-progress-heading-card">
          <h1>My Progress</h1>
        </div>

        <div className="employee-progress-time-columns">
          <div className="employee-progress-time-column">
            <div className="employee-progress-time-title">Weekly</div>
            {weekly.map((g) => <AssignedGoalRow key={g.id} goal={g} />)}
          </div>
          <div className="employee-progress-time-column">
            <div className="employee-progress-time-title">Monthly</div>
            {monthly.map((g) => <AssignedGoalRow key={g.id} goal={g} />)}
          </div>
          <div className="employee-progress-time-column">
            <div className="employee-progress-time-title">Yearly</div>
            {yearly.map((g) => <AssignedGoalRow key={g.id} goal={g} />)}
          </div>
        </div>

        <EmployeeDevelopmentGoals title="PDP Goals" goals={pdpGoals} onSelectGoal={setSelectedGoal} />
        <EmployeeDevelopmentGoals title="PIP Goals" goals={pipGoals} onSelectGoal={setSelectedGoal} />
      </div>

      <GoalEvidenceSubmission
        goal={selectedGoal}
        onClose={() => setSelectedGoal(null)}
        onSubmitEvidence={handleEvidenceSubmitted}
      />
    </div>
  );
}

export default EmployeeMyProgress;