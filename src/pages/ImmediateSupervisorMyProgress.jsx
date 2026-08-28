import { useEffect, useState } from "react";
import Sidebar from "../components/sidebar.jsx";
import Header from "../components/header.jsx";
import AssignedGoalRow from "../components/AssignedGoalRow";
import { getAssignedTimeGoals, subscribeToAssignedTimeGoals } from "../services/assignedTimeGoalsStorage";
import "../styles/immediatesupervisormyprogress.css";

// Temporary current-user identity until Supabase Auth/profile is connected.
const currentSupervisor = { id: "IMS00089", name: "Kasun Silva" };

function SupervisorMyProgress({ onNavigate }) {
  const [allGoals, setAllGoals] = useState(getAssignedTimeGoals());

  useEffect(() => {
    return subscribeToAssignedTimeGoals(() => setAllGoals(getAssignedTimeGoals()));
  }, []);

  // Only goals targeting this supervisor — never Employee-targeted goals.
  const mine = allGoals.filter(
    (g) => g.targetRole === "supervisor" && g.targetUserId === currentSupervisor.id
  );

  const weekly = mine.filter((g) => g.period === "Weekly");
  const monthly = mine.filter((g) => g.period === "Monthly");
  const yearly = mine.filter((g) => g.period === "Yearly");

  return (
    <div className="supervisor-progress-layout">
      <Sidebar role="supervisor" activeItem="progress" onNavigate={onNavigate} />

      <div className="supervisor-progress-main">
        <Header />

        <div className="supervisor-progress-heading-card">
          <h1>My Progress</h1>
        </div>

        <div className="supervisor-progress-columns">
          <div className="supervisor-progress-column">
            <div className="supervisor-progress-column-title">Weekly</div>
            {weekly.map((g) => <AssignedGoalRow key={g.id} goal={g} />)}
          </div>

          <div className="supervisor-progress-column">
            <div className="supervisor-progress-column-title">Monthly</div>
            {monthly.map((g) => <AssignedGoalRow key={g.id} goal={g} />)}
          </div>

          <div className="supervisor-progress-column">
            <div className="supervisor-progress-column-title">Yearly</div>
            {yearly.map((g) => <AssignedGoalRow key={g.id} goal={g} />)}
          </div>
        </div>
      </div>
    </div>
  );
}

export default SupervisorMyProgress;