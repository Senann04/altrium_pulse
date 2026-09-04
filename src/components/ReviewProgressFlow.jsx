import SpotlightCard from "./SpotlightCard";
import "../styles/reviewprogressflow.css";

function getStageState(status) {
  const normalized = status.toLowerCase();
  if (normalized.includes("complete")) return "complete";
  if (normalized.includes("progress")) return "active";
  return "pending";
}

function StageStateIcon({ state }) {
  if (state === "complete") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="m7 12.5 3.1 3.1L17.5 8" />
      </svg>
    );
  }

  if (state === "active") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 3a9 9 0 1 0 9 9" />
        <path d="M12 3a9 9 0 0 1 9 9" />
        <path d="m10 8 5 4-5 4Z" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5v5l3 1.8" />
    </svg>
  );
}

function ReviewProgressFlow({ stages, centerStatus }) {
  const startedStages = stages.filter((stage) => getStageState(stage.status) !== "pending").length;
  const progressPercent = stages.length ? Math.round((startedStages / stages.length) * 100) : 0;

  return (
    <div className="review-flow-wrapper">
      <SpotlightCard className="review-flow-overview" spotlightColor="rgba(252, 180, 0, 0.1)">
        <div>
          <span>Cycle status</span>
          <strong>{centerStatus}</strong>
        </div>
        <div className="review-flow-progress">
          <div className="review-flow-count"><strong>{startedStages}</strong><span>of {stages.length} stages started</span></div>
          <div
            className="review-flow-meter"
            role="progressbar"
            aria-label="Review cycle progress"
            aria-valuemin="0"
            aria-valuemax="100"
            aria-valuenow={progressPercent}
          >
            <span style={{ width: `${progressPercent}%` }} />
          </div>
        </div>
      </SpotlightCard>

      <div className="review-flow-list">
        {stages.map((stage, index) => {
          const state = getStageState(stage.status);
          return (
            <article className={`review-flow-stage review-flow-stage-${state}`} key={stage.key}>
              <span className="review-flow-stage-number">{String(index + 1).padStart(2, "0")}</span>
              <div>
                <span className="review-flow-stage-label">{stage.label}</span>
                <span className="review-flow-stage-status">{stage.status}</span>
              </div>
              <span className="review-flow-stage-state-icon">
                <StageStateIcon state={state} />
              </span>
            </article>
          );
        })}
      </div>
    </div>
  );
}

export default ReviewProgressFlow;
