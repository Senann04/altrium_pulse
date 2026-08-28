import "../styles/goalperiodpill.css";

// One reusable pill for Weekly/Monthly/Yearly Goal — label
function GoalPeriodPill({ label, progress, onClick }) {
  return (
    <button
      type="button"
      className="goal-period-pill"
      onClick={onClick}
      style={{ "--progress": `${progress}%` }}
    >
      <span className="goal-period-pill-label">{label}</span>
      <span className="goal-period-pill-circle" />
    </button>
  );
}

export default GoalPeriodPill;
