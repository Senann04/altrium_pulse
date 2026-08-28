import "../styles/goalprogresscard.css";

/* Reusable for both PDP and PIP — title and plan data are passed in as
 props, so this component never needs to know which one it's rendering. */
function GoalProgressCard({ title, plan }) {
  const totalActions = plan.action_items.length;
  const completedActions = plan.action_items.filter((item) => item.completed).length;

  // Progress = completed actions / total actions * 100.
  const progress = Math.round((completedActions / totalActions) * 100);

  return (
    <div className="goal-progress-card">
      <div className="goal-progress-header">
        <span className="goal-progress-title">{title}</span>
        <span className="goal-progress-badge">{progress}%</span>
      </div>

      <div className="goal-progress-track">
        <div className="goal-progress-fill" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}

export default GoalProgressCard;