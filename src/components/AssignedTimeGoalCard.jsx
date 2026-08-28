import "../styles/assignedtimegoalcard.css";

function AssignedTimeGoalCard({ goal }) {
  return (
    <div className="assigned-time-goal-card">
      <div className="assigned-time-goal-field">
        <label>Immediate Supervisor/Employee ID:</label>
        <div className="assigned-time-goal-value">{goal.personId}</div>
      </div>

      <div className="assigned-time-goal-field">
        <label>Immediate Supervisor/Employee Name:</label>
        <div className="assigned-time-goal-value">{goal.personName}</div>
      </div>

      <div className="assigned-time-goal-field">
        <label>Team:</label>
        <div className="assigned-time-goal-value">{goal.team}</div>
      </div>

      <div className="assigned-time-goal-field">
        <label>Goal:</label>
        <div className="assigned-time-goal-value">{goal.goal}</div>
      </div>

      <div className="assigned-time-goal-footer">
        <span className="assigned-time-goal-status-pill">{goal.status}</span>
      </div>
    </div>
  );
}

export default AssignedTimeGoalCard;
