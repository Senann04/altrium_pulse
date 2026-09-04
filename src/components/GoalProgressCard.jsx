import "../styles/goalprogresscard.css";

/* Reusable for both PDP and PIP — title and plan data are passed in as
 props, so this component never needs to know which one it's rendering. */
function GoalProgressCard({ title, plan, progress: progressValue }) {
  const actions = plan?.action_items || [];
  const completedActions = actions.filter((item) => item.completed).length;
  const calculatedProgress = actions.length ? Math.round((completedActions / actions.length) * 100) : 0;
  const progress = Math.max(0, Math.min(100, Number(progressValue ?? calculatedProgress) || 0));

  return (
    <article className="goal-progress-card">
      <div className="goal-progress-header">
        <span className="goal-progress-title">{title}</span>
        <span className="goal-progress-badge">{progress}%</span>
      </div>

      <div className="goal-progress-track">
        <div className="goal-progress-fill" style={{ width: `${progress}%` }} />
      </div>
    </article>
  );
}

export default GoalProgressCard;
