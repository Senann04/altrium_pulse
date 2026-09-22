import "../styles/assignedgoalrow.css";

function AssignedGoalRow({ goal }) {
  const progress = Number(goal.progress) || 0;
  return <div className="time-goal-progress">
    <div className="assigned-goal-row"><span className="assigned-goal-row-text">{goal.goal}</span><span className="assigned-goal-row-pill">{progress}%</span></div>
    <small>Official progress is updated by your supervisor or HRBP.</small>
  </div>;
}
export default AssignedGoalRow;
