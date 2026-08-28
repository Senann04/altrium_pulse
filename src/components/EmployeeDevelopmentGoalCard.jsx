import "../styles/employeedevelopmentgoalcard.css";

/* now clickable so the employee can open the proof-submission panel for this goal */
function EmployeeDevelopmentGoalCard({ goal, onClick }) {
  return (
    <div className="dev-goal-card" onClick={() => onClick && onClick(goal)} style={{ cursor: "pointer" }}>
      <div className="dev-goal-inner">
        <div className="dev-goal-header">
          <span className="dev-goal-title">{goal.title}</span>
          <span className="dev-goal-status-badge">{goal.status}</span>
        </div>

        <div className="dev-goal-dates">
          <span>{goal.start_date}</span>
          <span>{goal.target_date}</span>
        </div>

        <div className="dev-goal-progress-row">
          <div className="dev-goal-progress-track">
            <div className="dev-goal-progress-fill" style={{ width: `${goal.progress}%` }} />
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