import { useEffect, useState } from "react";
import Sidebar from "../components/sidebar.jsx";
import Header from "../components/header.jsx";
import AssignedGoalRow from "../components/AssignedGoalRow";
import {
  getAssignedTimeGoals,
  refreshAssignedTimeGoals,
  subscribeToAssignedTimeGoals,
} from "../services/assignedTimeGoalsStorage";
import "../styles/immediatesupervisormyprogress.css";

function SupervisorMyProgress({ onNavigate }) {
  const [allGoals, setAllGoals] = useState(getAssignedTimeGoals());

  useEffect(() => {
    const unsubscribe = subscribeToAssignedTimeGoals(() => setAllGoals(getAssignedTimeGoals()));
    refreshAssignedTimeGoals().catch((error) => {
      console.error("Unable to load supervisor goals", error);
    });
    return unsubscribe;
  }, []);

  // Supabase RLS limits visible goals to the signed-in user's permitted records.
  const mine = allGoals.filter((g) => g.targetRole === "supervisor");

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
