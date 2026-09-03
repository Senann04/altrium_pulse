import { useEffect, useState } from "react";
import Sidebar from "../components/sidebar.jsx";
import Header from "../components/header.jsx";
import AssignedGoalRow from "../components/AssignedGoalRow.jsx";
import WorkspaceHeading from "../components/WorkspaceHeading";
import { getAssignedTimeGoals, subscribeToAssignedTimeGoals } from "../services/assignedTimeGoalsStorage.js";
import "../styles/immediatesupervisormyprogress.css";

// Temporary current-user identity until Supabase Auth/profile is connected.
const currentSupervisor = { id: "IMS00089", name: "Kasun Silva" };

function SupervisorMyProgress({ onNavigate, onSignOut, profileData }) {
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
      <Sidebar role="supervisor" activeItem="progress" onNavigate={onNavigate} profileData={profileData} onSignOut={onSignOut} />

      <div className="supervisor-progress-main">
        <Header title="My Progress" profileData={profileData} />

        <WorkspaceHeading
          eyebrow="Goals and delivery"
          title="My Progress"
          description="Keep weekly commitments and longer-term priorities visible in one place."
        />

        <div className="supervisor-progress-columns">
          <div className="supervisor-progress-column">
            <div className="supervisor-progress-column-title">Weekly</div>
            {!weekly.length && <p className="supervisor-progress-empty">No weekly goals assigned.</p>}
            {weekly.map((g) => <AssignedGoalRow key={g.id} goal={g} />)}
          </div>

          <div className="supervisor-progress-column">
            <div className="supervisor-progress-column-title">Monthly</div>
            {!monthly.length && <p className="supervisor-progress-empty">No monthly goals assigned.</p>}
            {monthly.map((g) => <AssignedGoalRow key={g.id} goal={g} />)}
          </div>

          <div className="supervisor-progress-column">
            <div className="supervisor-progress-column-title">Yearly</div>
            {!yearly.length && <p className="supervisor-progress-empty">No yearly goals assigned.</p>}
            {yearly.map((g) => <AssignedGoalRow key={g.id} goal={g} />)}
          </div>
        </div>
      </div>
    </div>
  );
}

export default SupervisorMyProgress;
