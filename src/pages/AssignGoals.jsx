import Sidebar from "../components/sidebar.jsx";
import Header from "../components/header.jsx";
import AssignedGoalSection from "../components/AssignedGoalSection";
import AssignedTimeGoalSection from "../components/AssignedTimeGoalSection";
import WorkspaceHeading from "../components/WorkspaceHeading";
import "../styles/assigngoals.css";

function AssignGoals({ onNavigate, onSignOut, profileData }) {
  return (
    <div className="assign-goals-layout">
      <Sidebar role="hrbp" activeItem="assign-goals" onNavigate={onNavigate} profileData={profileData} onSignOut={onSignOut} />

      <div className="assign-goals-main">
        <Header title="Assign Goals" profileData={profileData} />

        <WorkspaceHeading
          eyebrow="Goal administration"
          title="Assign Goals"
          description="Create clear development, improvement and time-based goals for each team."
        />

        {/* PDP/PIP use the goal assignment system (GoalAssignmentModal) */}
        <AssignedGoalSection type="PDP" title="Assigned PDP goals" />
        <AssignedGoalSection type="PIP" title="Assigned PIP goals" />

        {/* Weekly/Monthly/Yearly use the separate time goal system (TimeGoalAssignmentModal) */}
        <AssignedTimeGoalSection period="Weekly" title="Assigned weekly goals" />
        <AssignedTimeGoalSection period="Monthly" title="Assigned monthly goals" />
        <AssignedTimeGoalSection period="Yearly" title="Assigned yearly goals" />
      </div>
    </div>
  );
}

export default AssignGoals;
