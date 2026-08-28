import EmployeeDevelopmentGoalCard from "./EmployeeDevelopmentGoalCard";
import "../styles/employeedevelopmentgoals.css";

/* Temporary frontend values until assigned PDP/PIP records are loaded from Supabase. 
These represent goals already assigned via the HR Assign Goals feature.*/
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
function EmployeeDevelopmentGoals({ title, goals }) {
  // Summary values calculated live from the goals array.
  const activeGoals = goals.filter((g) => g.status === "Ongoing").length;
  const completed = goals.filter((g) => g.status === "Completed").length;
  const overdue = goals.filter((g) => g.status === "Overdue").length;
  const averageProgress = Math.round(
    goals.reduce((sum, g) => sum + g.progress, 0) / goals.length
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