import "../styles/reviewprogressflow.css";

function getStageState(status) {
  const normalized = status.toLowerCase();
  if (normalized.includes("complete")) return "complete";
  if (normalized.includes("progress")) return "active";
  return "pending";
}

function ReviewProgressFlow({ stages, centerStatus }) {
  const activeStages = stages.filter((stage) => getStageState(stage.status) !== "pending").length;

  return (
    <div className="review-flow-wrapper">
      <div className="review-flow-center">
        <div>
          <span>Cycle status</span>
          <strong>{centerStatus}</strong>
        </div>
        <small>{activeStages} of {stages.length} stages started</small>
      </div>

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
              <i aria-hidden="true" />
            </article>
          );
        })}
      </div>
    </div>
  );
}

export default ReviewProgressFlow;
