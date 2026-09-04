import EmployeeDevelopmentGoalCard from "./EmployeeDevelopmentGoalCard";
import "../styles/employeedevelopmentgoals.css";

function PlanMetricIcon({ type }) {
  if (type === "progress") {
    return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 18V6M4 18h16" /><path d="m7 14 3-3 3 2 5-6" /><path d="M15 7h3v3" /></svg>;
  }
  if (type === "completed") {
    return <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5" /><path d="m8 12.5 2.6 2.6L16.5 9" /></svg>;
  }
  if (type === "overdue") {
    return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10.1 4.4 3.2 17a2 2 0 0 0 1.8 3h14a2 2 0 0 0 1.8-3L13.9 4.4a2.2 2.2 0 0 0-3.8 0Z" /><path d="M12 9v4M12 16.5v.1" /></svg>;
  }
  return <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5" /><circle cx="12" cy="12" r="4.5" /><path d="M12 3.5V6M20.5 12H18" /></svg>;
}

/* onSelectGoal is optional so this still works anywhere it isn't clickable */
function EmployeeDevelopmentGoals({ title, goals, onSelectGoal }) {
  const summary = goals.reduce(
    (result, goal) => ({
      active: result.active + Number(goal.status === "Ongoing"),
      completed: result.completed + Number(goal.status === "Completed"),
      overdue: result.overdue + Number(goal.status === "Overdue"),
      progress: result.progress + goal.progress,
    }),
    { active: 0, completed: 0, overdue: 0, progress: 0 },
  );
  const averageProgress = goals.length ? Math.round(summary.progress / goals.length) : 0;

  const statusPriority = { Overdue: 0, Ongoing: 1, Completed: 2 };
  const visibleGoals = [...goals].sort(
    (left, right) => (statusPriority[left.status] ?? 3) - (statusPriority[right.status] ?? 3),
  );

  const metrics = [
    { type: "active", label: "Active goals", value: summary.active },
    { type: "progress", label: "Average progress", value: `${averageProgress}%` },
    { type: "completed", label: "Completed", value: summary.completed },
    { type: "overdue", label: "Overdue", value: summary.overdue },
  ];

  return (
    <section className="dev-goals-section">
      <div className="dev-goals-header">
        <div><span>Development plan</span><h2>{title}</h2></div>
        <span className="dev-goals-plan-count">{goals.length} total goals</span>
      </div>

      <div className="dev-goals-summary-row">
        {metrics.map((metric) => (
          <div className={`dev-goals-summary-circle dev-goals-summary-${metric.type}`} key={metric.type}>
            <span className="dev-goals-summary-icon"><PlanMetricIcon type={metric.type} /></span>
            <span className="dev-goals-summary-label">{metric.label}</span>
            <span className="dev-goals-summary-value">{metric.value}</span>
          </div>
        ))}
      </div>

      <div className="dev-goals-card-list">
        {visibleGoals.map((goal) => (
          <EmployeeDevelopmentGoalCard key={goal.id} goal={goal} onClick={onSelectGoal} />
        ))}
        {!visibleGoals.length && <p className="dev-goals-empty">No {title.toLowerCase()} assigned.</p>}
      </div>
    </section>
  );
}

export default EmployeeDevelopmentGoals;
