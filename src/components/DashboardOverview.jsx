import SpotlightCard from "./SpotlightCard";
import GoalProgressCard from "./GoalProgressCard";
import "../styles/dashboardoverview.css";

const roleContent = {
  employee: {
    eyebrow: "Your performance snapshot",
    title: "Build momentum, one goal at a time.",
    description: "Track your review, stay ahead of deadlines and turn feedback into focused progress.",
    primaryAction: { label: "View current review", page: "current-review" },
    secondaryAction: { label: "Open my progress", page: "progress" },
    stats: [
      { label: "Review progress", value: "62%", trend: "+8% this month", tone: "gold" },
      { label: "Goals completed", value: "8/12", trend: "4 remaining", tone: "green" },
      { label: "Overall rating", value: "4.5", trend: "Strong performance", tone: "blue" },
    ],
  },
  supervisor: {
    eyebrow: "Team performance snapshot",
    title: "Lead with clarity and timely feedback.",
    description: "Keep your team aligned, identify blockers early and move every review forward.",
    primaryAction: { label: "Review my team", page: "team" },
    secondaryAction: { label: "Open current review", page: "current-review" },
    stats: [
      { label: "Team members", value: "03", trend: "All active", tone: "gold" },
      { label: "Reviews on track", value: "84%", trend: "+12% this cycle", tone: "green" },
      { label: "Feedback pending", value: "02", trend: "Due this week", tone: "blue" },
    ],
  },
  hrbp: {
    eyebrow: "People operations snapshot",
    title: "Keep every review cycle moving.",
    description: "Coordinate goals, monitor participation and support consistent performance decisions.",
    primaryAction: { label: "Manage review cycle", page: "review-cycle" },
    secondaryAction: { label: "Assign goals", page: "assign-goals" },
    stats: [
      { label: "Cycle completion", value: "76%", trend: "+14% this week", tone: "gold" },
      { label: "Active reviews", value: "24", trend: "18 on track", tone: "green" },
      { label: "Actions required", value: "06", trend: "Needs attention", tone: "blue" },
    ],
  },
  leadership: {
    eyebrow: "Organisation performance",
    title: "See the signal behind your people data.",
    description: "A focused view of performance health, review progress and organisation-wide momentum.",
    primaryAction: { label: "View executive profile", page: "profile" },
    secondaryAction: null,
    stats: [
      { label: "Review completion", value: "81%", trend: "+9% this cycle", tone: "gold" },
      { label: "Goal alignment", value: "88%", trend: "Healthy", tone: "green" },
      { label: "Average rating", value: "4.2", trend: "+0.3 year on year", tone: "blue" },
    ],
  },
};

const progressPlans = {
  pdp: {
    action_items: [
      { completed: true }, { completed: true }, { completed: true },
      { completed: false }, { completed: false },
    ],
  },
  pip: {
    action_items: [
      { completed: true }, { completed: true }, { completed: true }, { completed: true },
      { completed: true }, { completed: false }, { completed: false }, { completed: false },
    ],
  },
};

const priorityTasks = {
  employee: [
    { day: "02", month: "OCT", title: "Performance review checkpoint", detail: "Review progress and complete outstanding actions", page: "current-review" },
    { day: "07", month: "OCT", title: "Goal alignment session", detail: "Confirm priorities for the upcoming period", page: "progress" },
    { day: "14", month: "OCT", title: "Feedback window closes", detail: "Submit feedback before the cycle deadline", page: "feedback" },
  ],
  supervisor: [
    { day: "02", month: "OCT", title: "Performance review checkpoint", detail: "Review progress and complete outstanding actions", page: "current-review" },
    { day: "07", month: "OCT", title: "Team alignment session", detail: "Confirm priorities with your direct reports", page: "team" },
    { day: "14", month: "OCT", title: "Feedback window closes", detail: "Complete feedback before the cycle deadline", page: "feedback" },
  ],
  hrbp: [
    { day: "02", month: "OCT", title: "Review cycle checkpoint", detail: "Monitor completion and outstanding actions", page: "review-cycle" },
    { day: "07", month: "OCT", title: "Goal assignment review", detail: "Confirm priorities for the upcoming period", page: "assign-goals" },
    { day: "14", month: "OCT", title: "Profile data review", detail: "Verify your business partner information", page: "profile" },
  ],
  leadership: [
    { day: "02", month: "OCT", title: "Executive performance briefing", detail: "Review organisation-wide progress", page: "dashboard" },
    { day: "07", month: "OCT", title: "Goal alignment checkpoint", detail: "Review strategic performance indicators", page: "dashboard" },
    { day: "14", month: "OCT", title: "Profile data review", detail: "Verify leadership account information", page: "profile" },
  ],
};

function DashboardOverview({ role, profileData, onNavigate }) {
  const content = roleContent[role] || roleContent.employee;
  const displayName = profileData?.name || "Team member";
  const identifier = profileData?.identifier || profileData?.jobTitle || "Altrium Pulse";
  const tasks = priorityTasks[role] || priorityTasks.employee;
  const progressPage = role === "hrbp" ? "assign-goals" : role === "leadership" ? "profile" : "progress";

  return (
    <div className="dashboard-overview">
      <SpotlightCard className="dashboard-hero" spotlightColor="rgba(252, 180, 0, 0.2)">
        <div className="dashboard-hero-copy">
          <span className="dashboard-eyebrow">{content.eyebrow}</span>
          <h2>{content.title}</h2>
          <p>{content.description}</p>
          <div className="dashboard-actions">
            <button type="button" className="dashboard-action-primary" onClick={() => onNavigate?.(content.primaryAction.page)}>
              {content.primaryAction.label}<span aria-hidden="true">→</span>
            </button>
            {content.secondaryAction && (
              <button type="button" className="dashboard-action-secondary" onClick={() => onNavigate?.(content.secondaryAction.page)}>
                {content.secondaryAction.label}
              </button>
            )}
          </div>
        </div>
        <div className="dashboard-person">
          <span className="dashboard-avatar">{displayName.slice(0, 1).toUpperCase()}</span>
          <div><strong>{displayName}</strong><span>{identifier}</span></div>
          <span className="dashboard-person-status">Active</span>
        </div>
        <div className="dashboard-hero-orb" aria-hidden="true" />
      </SpotlightCard>

      <div className="dashboard-stats" aria-label="Performance summary">
        {content.stats.map((stat) => (
          <article key={stat.label} className="dashboard-stat-card">
            <div className={`dashboard-stat-icon dashboard-stat-icon-${stat.tone}`} aria-hidden="true">
              <span />
            </div>
            <div className="dashboard-stat-copy">
              <span>{stat.label}</span>
              <strong>{stat.value}</strong>
              <small>{stat.trend}</small>
            </div>
          </article>
        ))}
      </div>

      <div className="dashboard-detail-grid">
        <section className="dashboard-panel dashboard-priority-panel">
          <div className="dashboard-panel-heading">
            <div><span>Up next</span><h3>Priority actions</h3></div>
            <span className="dashboard-panel-count">03</span>
          </div>
          <div className="dashboard-task-list">
            {tasks.map((task) => (
              <button key={`${task.day}-${task.title}`} type="button" onClick={() => onNavigate?.(task.page)}>
                <span className="dashboard-task-date"><strong>{task.day}</strong>{task.month}</span>
                <span className="dashboard-task-copy"><strong>{task.title}</strong><small>{task.detail}</small></span>
                <span className="dashboard-task-arrow" aria-hidden="true">↗</span>
              </button>
            ))}
          </div>
        </section>

        <section className="dashboard-panel dashboard-progress-panel">
          <div className="dashboard-panel-heading">
            <div><span>Current cycle</span><h3>Goal progress</h3></div>
            <button type="button" onClick={() => onNavigate?.(progressPage)}>View all</button>
          </div>
          <GoalProgressCard title="Development plan" plan={progressPlans.pdp} />
          <GoalProgressCard title="Performance plan" plan={progressPlans.pip} />
          <div className="dashboard-cycle-note"><span>●</span> Cycle on track <small>Next review: 02 October</small></div>
        </section>
      </div>
    </div>
  );
}

export default DashboardOverview;
