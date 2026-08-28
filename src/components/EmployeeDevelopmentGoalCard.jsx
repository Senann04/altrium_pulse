import "../styles/employeedevelopmentgoalcard.css";

function EmployeeDevelopmentGoalCard({ goal }) {
  return (
    <div className="dev-goal-card">
      <div className="dev-goal-inner">
        <div className="dev-goal-header">
          <span className="dev-goal-title">{goal.title}</span>
          <span className="dev-goal-status-badge">{goal.status}</span>
        </div>
        {/* Goal description box is scrollable if the text is too long.*/}

        <div className="dev-goal-dates">
          <span>{goal.start_date}</span>
          <span>{goal.target_date}</span>
        </div>

        <div className="dev-goal-progress-row">
          <div className="dev-goal-progress-track">
            <div
              className="dev-goal-progress-fill"
              style={{ width: `${goal.progress}%` }}
            />
          </div>
          <span className="dev-goal-progress-value">
            {String(goal.progress).padStart(2, "0")}%
          </span>
        </div>
      </div>
    </div>
  );
}

export default EmployeeDevelopmentGoalCard;