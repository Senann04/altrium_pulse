import EmployeeDevelopmentGoalCard from "./EmployeeDevelopmentGoalCard";
import "../styles/employeedevelopmentgoals.css";

/* temporary values until assigned PDP/PIP records are loaded from Supabase */
export const employeeDevelopmentPlans = {
  PDP: [
    { id: "pdp-1", title: "Improve UI/UX Design Skills", status: "Ongoing", start_date: "2026-07-02", target_date: "2026-07-16", progress: 37 },
    { id: "pdp-2", title: "Develop Communication Skills", status: "Ongoing", start_date: "2026-07-29", target_date: "2026-07-10", progress: 24 },
    { id: "pdp-3", title: "Strengthen Problem-Solving Abilities", status: "Ongoing", start_date: "2026-07-05", target_date: "2026-07-19", progress: 6 },
    { id: "pdp-4", title: "Complete Leadership Training", status: "Completed", start_date: "2026-01-10", target_date: "2026-02-10", progress: 100 },
    { id: "pdp-5", title: "Mentor a Junior Colleague", status: "Completed", start_date: "2026-02-01", target_date: "2026-03-01", progress: 100 },
    { id: "pdp-6", title: "Present Quarterly Review", status: "Completed", start_date: "2026-03-01", target_date: "2026-04-01", progress: 100 },
    { id: "pdp-7", title: "Complete Certification Course", status: "Completed", start_date: "2026-04-01", target_date: "2026-05-01", progress: 100 },
    { id: "pdp-8", title: "Lead Cross-Team Project", status: "Overdue", start_date: "2026-05-01", target_date: "2026-06-01", progress: 15 },
  ],
  PIP: [
    { id: "pip-1", title: "Gain Real-World UX/UI Experience", status: "Ongoing", start_date: "2026-07-02", target_date: "2026-07-16", progress: 33 },
    { id: "pip-2", title: "Learn Industry Design Standards", status: "Ongoing", start_date: "2026-07-29", target_date: "2026-07-10", progress: 24 },
    { id: "pip-3", title: "Build a Strong Professional Portfolio", status: "Ongoing", start_date: "2026-05-07", target_date: "2026-07-10", progress: 9 },
    { id: "pip-4", title: "Attend Weekly Check-ins", status: "Completed", start_date: "2026-01-10", target_date: "2026-02-10", progress: 100 },
    { id: "pip-5", title: "Meet Sprint Delivery Targets", status: "Completed", start_date: "2026-02-01", target_date: "2026-03-01", progress: 100 },
    { id: "pip-6", title: "Reduce Reported Defect Rate", status: "Completed", start_date: "2026-03-01", target_date: "2026-04-01", progress: 100 },
    { id: "pip-7", title: "Complete Communication Workshop", status: "Completed", start_date: "2026-04-01", target_date: "2026-05-01", progress: 100 },
    { id: "pip-8", title: "Submit Self-Assessment Summary", status: "Overdue", start_date: "2026-05-01", target_date: "2026-06-01", progress: 10 },
  ],
};

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
  const visibleGoals = [...goals]
    .filter((goal) => goal.status !== "Completed")
    .sort((left, right) => statusPriority[left.status] - statusPriority[right.status]);

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
      </div>
    </section>
  );
}

export default EmployeeDevelopmentGoals;
