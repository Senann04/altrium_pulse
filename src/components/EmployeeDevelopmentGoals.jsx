import EmployeeDevelopmentGoalCard from "./EmployeeDevelopmentGoalCard";
import "../styles/employeedevelopmentgoals.css";

/* Gold progress icon used at the top of each summary circle.*/
function TargetIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#f8b50d" strokeWidth="2">
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1.5" fill="#f8b50d" />
    </svg>
  );
}

/*Reusable for both "PDP Goals" and "PIP Goals" — title and goals are
passed in as props, no PDP/PIP branching inside this component.*/
function EmployeeDevelopmentGoals({ title, goals = [] }) {
  // Summary values calculated live from the goals array.
  const activeGoals = goals.filter((g) => g.status === "Ongoing").length;
  const completed = goals.filter((g) => g.status === "Completed").length;
  const overdue = goals.filter((g) => g.status === "Overdue").length;
  const averageProgress = Math.round(
    goals.length ? goals.reduce((sum, g) => sum + g.progress, 0) / goals.length : 0,
  );

  const visibleGoals = goals.filter((g) => g.status === "Ongoing");

  return (
    <section className="dev-goals-section">
      <div className="dev-goals-title-pill">{title}</div>

      <div className="dev-goals-summary-row">
        <div className="dev-goals-summary-circle">
          <TargetIcon />
          <span className="dev-goals-summary-label">Active Goals</span>
          <span className="dev-goals-summary-value">{activeGoals}</span>
        </div>
        <div className="dev-goals-summary-circle">
          <TargetIcon />
          <span className="dev-goals-summary-label">Average Progress</span>
          <span className="dev-goals-summary-value">{averageProgress}%</span>
        </div>
        <div className="dev-goals-summary-circle">
          <TargetIcon />
          <span className="dev-goals-summary-label">Completed</span>
          <span className="dev-goals-summary-value">{completed}</span>
        </div>
        <div className="dev-goals-summary-circle">
          <TargetIcon />
          <span className="dev-goals-summary-label">Overdue</span>
          <span className="dev-goals-summary-value">{overdue}</span>
        </div>
      </div>

      <div className="dev-goals-card-list">
        {visibleGoals.map((goal) => (
          <EmployeeDevelopmentGoalCard key={goal.id} goal={goal} />
        ))}
      </div>
    </section>
  );
}

export default EmployeeDevelopmentGoals;
