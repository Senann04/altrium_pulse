import "../styles/reviewprogressflow.css";

/* default 6-stage hexagon layout, used when no arrowClasses are passed (Employee page) */
const defaultPositions = [
  "top-center",
  "top-right",
  "bottom-right",
  "bottom-center",
  "bottom-left",
  "top-left",
];
const defaultArrowClasses = [
  "review-flow-arrow-1",
  "review-flow-arrow-2",
  "review-flow-arrow-3",
  "review-flow-arrow-4",
  "review-flow-arrow-5",
  "review-flow-arrow-6",
];

function ReviewProgressFlow({
  stages,
  centerStatus,
  positions = defaultPositions,
  arrowClasses = defaultArrowClasses,
}) {
  const arrowsToRender = arrowClasses.slice(0, stages.length);

  return (
    <div className="review-flow-wrapper">
      <div className="review-flow-center">
        <div className="review-flow-center-pie" />
        <span className="review-flow-center-label">{centerStatus}</span>
      </div>

      {stages.map((stage, index) => (
        <div
          key={stage.key}
          className={`review-flow-stage review-flow-pos-${positions[index] || "top-center"}`}
        >
          <span className="review-flow-stage-label">{stage.label}</span>
          <span className="review-flow-stage-status">{stage.status}</span>
        </div>
      ))}

      {arrowsToRender.map((cls) => (
        <span key={cls} className={`review-flow-arrow ${cls}`}>
          ↷
        </span>
      ))}
    </div>
  );
}

export default ReviewProgressFlow;