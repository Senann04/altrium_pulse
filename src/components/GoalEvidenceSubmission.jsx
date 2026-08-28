import { useState } from "react";
import "../styles/goalevidencesubmission.css";

/* reused for both PDP and PIP goals — the goal itself is passed in via props */
function GoalEvidenceSubmission({ goal, onClose, onSubmitEvidence }) {
  const [actionItemFile, setActionItemFile] = useState(null);
  const [evidenceFile, setEvidenceFile] = useState(null);

  if (!goal) return null;

  /* +10% here is only the illustrative badge shown in the design,
     not a real rule — actual progress still comes from completed/total */
  const handleSubmitEvidence = () => {
    if (!evidenceFile) return;
    onSubmitEvidence(goal.id);
    onClose();
  };

  return (
    <div className="goal-evidence-overlay" onClick={onClose}>
      <div className="goal-evidence-panel" onClick={(e) => e.stopPropagation()}>
        <div className="goal-evidence-progress-row">
          <div className="goal-evidence-progress-badge">
            <span>Progress</span>
            <span className="goal-evidence-plus-tag">+10%</span>
          </div>
          <div className="goal-evidence-progress-circle">{goal.progress}%</div>
        </div>

        <div className="goal-evidence-content-box" />

        <p className="goal-evidence-instruction">
          If you completed this {goal.title ? "PDP" : "PDP"} goal please submit Action Item file and
          Evidence file here...
        </p>

        <div className="goal-evidence-field-row">
          <label>1. Action Item</label>
          <div className="goal-evidence-file-row">
            <label className="goal-evidence-file-input">
              Choose File
              <input type="file" onChange={(e) => setActionItemFile(e.target.files[0] || null)} hidden />
            </label>
            <span className="goal-evidence-filename">{actionItemFile ? actionItemFile.name : ""}</span>
            <button type="button" className="goal-evidence-submit-button" disabled={!actionItemFile}>
              SUBMIT
            </button>
          </div>
        </div>

        <div className="goal-evidence-field-row">
          <label>2. Evidence</label>
          <div className="goal-evidence-file-row">
            <label className="goal-evidence-file-input">
              Choose File
              <input type="file" onChange={(e) => setEvidenceFile(e.target.files[0] || null)} hidden />
            </label>
            <span className="goal-evidence-filename">{evidenceFile ? evidenceFile.name : ""}</span>
            <button
              type="button"
              className="goal-evidence-submit-button"
              disabled={!evidenceFile}
              onClick={handleSubmitEvidence}
            >
              SUBMIT
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default GoalEvidenceSubmission;