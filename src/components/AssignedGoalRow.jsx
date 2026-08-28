import "../styles/assignedgoalrow.css";

function AssignedGoalRow({ goal }) {
  return (
    <div className="assigned-goal-row">
      <span className="assigned-goal-row-text">{goal.goal}</span>
      <span className="assigned-goal-row-pill">{goal.progress}%</span>
    </div>
  );
}

export default AssignedGoalRow;