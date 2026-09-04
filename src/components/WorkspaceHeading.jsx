import SpotlightCard from "./SpotlightCard";
import "../styles/workspaceheading.css";

function WorkspaceHeading({ eyebrow, title, description, meta }) {
  return (
    <SpotlightCard className="workspace-heading" spotlightColor="rgba(252, 180, 0, 0.12)">
      <div className="workspace-heading-copy">
        <span>{eyebrow}</span>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {meta && <div className="workspace-heading-meta">{meta}</div>}
    </SpotlightCard>
  );
}

export default WorkspaceHeading;
