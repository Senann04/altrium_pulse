import Sidebar from "../components/sidebar.jsx";
import Header from "../components/header.jsx";
import AssignedGoalSection from "../components/AssignedGoalSection";
import AssignedTimeGoalSection from "../components/AssignedTimeGoalSection";
import "../styles/assigngoals.css";

function AssignGoals({ onNavigate, onSignOut, profileData }) {
  return (
    <div className="assign-goals-layout">
      <Sidebar role="hrbp" activeItem="assign-goals" onNavigate={onNavigate} profileData={profileData} onSignOut={onSignOut} />

      <div className="assign-goals-main">
        <Header title="Assign Goals" profileData={profileData} />

        <div className="assign-goals-heading-card">
          <div><span>Performance</span><h1>Assign Goals</h1><p>Create and monitor development goals for your teams.</p></div>
        </div>

        {/* PDP/PIP use the goal assignment system (GoalAssignmentModal) */}
        <AssignedGoalSection type="PDP" title="ASSIGNED PDP GOALS" />
        <AssignedGoalSection type="PIP" title="ASSIGNED PIP GOALS" />

        {/* Weekly/Monthly/Yearly use the separate time goal system (TimeGoalAssignmentModal) */}
        <AssignedTimeGoalSection period="Weekly" title="ASSIGNED WEEKLY GOALS" />
        <AssignedTimeGoalSection period="Monthly" title="ASSIGNED MONTHLY GOALS" />
        <AssignedTimeGoalSection period="Yearly" title="ASSIGNED YEARLY GOALS" />
      </div>
    </div>
  );
}

export default AssignGoals;
