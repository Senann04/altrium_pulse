import { useEffect, useState } from "react";
import "../styles/goalevidencesubmission.css";

/* reused for both PDP and PIP goals — the goal itself is passed in via props */
function GoalEvidenceSubmission({ goal, onClose, onSubmitEvidence }) {
  const [actionItemFile, setActionItemFile] = useState(null);
  const [evidenceFile, setEvidenceFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const closePanel = () => {
    setActionItemFile(null);
    setEvidenceFile(null);
    setError("");
    onClose();
  };

  useEffect(() => {
    if (!goal) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setActionItemFile(null);
        setEvidenceFile(null);
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goal, onClose]);

  if (!goal) return null;

  const goalType = goal.type || "PDP";
  const progress = Math.min(100, Math.max(0, Number(goal.progress) || 0));
  const filesReady = Boolean(actionItemFile && evidenceFile);

  const handleSubmitEvidence = async () => {
    if (!filesReady || isSubmitting) return;
    setIsSubmitting(true);
    setError("");
    try {
      await onSubmitEvidence(goal.id, { actionItemFile, evidenceFile });
      closePanel();
    } catch (submissionError) {
      setError(submissionError.message || "Unable to upload this evidence.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="goal-evidence-overlay" onClick={closePanel}>
      <section
        className="goal-evidence-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="goal-evidence-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="goal-evidence-header">
          <div>
            <span className="goal-evidence-eyebrow">Goal evidence</span>
            <h2 id="goal-evidence-title">{goal.title}</h2>
          </div>
          <div className="goal-evidence-header-actions">
            <span className="goal-evidence-type">{goalType}</span>
            <button type="button" className="goal-evidence-close" onClick={closePanel} aria-label="Close evidence form">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M6 6l12 12M18 6 6 18" />
              </svg>
            </button>
          </div>
        </header>

        <div className="goal-evidence-progress-block">
          <div className="goal-evidence-progress-copy">
            <span>Current progress</span>
            <strong>{progress}% complete</strong>
          </div>
          <div
            className="goal-evidence-progress-track"
            role="progressbar"
            aria-label={`${goal.title} progress`}
            aria-valuemin="0"
            aria-valuemax="100"
            aria-valuenow={progress}
          >
            <span style={{ width: `${progress}%` }} />
          </div>
        </div>

        <p className="goal-evidence-instruction">
          Add the completed action item and supporting evidence for this {goalType} goal. Both files are
          required before you can submit.
        </p>

        <div className="goal-evidence-file-grid">
          <label className={`goal-evidence-file-card${actionItemFile ? " has-file" : ""}`} htmlFor="goal-action-item-file">
            <input
              id="goal-action-item-file"
              className="goal-evidence-native-input"
              type="file"
              onChange={(event) => setActionItemFile(event.target.files[0] || null)}
            />
            <span className="goal-evidence-file-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <path d="M14 2v6h6M8 15h8M8 11h2" />
              </svg>
            </span>
            <span className="goal-evidence-file-copy">
              <strong>1. Action item</strong>
              <small>{actionItemFile?.name || "PDF, document or image"}</small>
            </span>
            <span className="goal-evidence-choose">{actionItemFile ? "Change" : "Choose file"}</span>
          </label>

          <label className={`goal-evidence-file-card${evidenceFile ? " has-file" : ""}`} htmlFor="goal-evidence-file">
            <input
              id="goal-evidence-file"
              className="goal-evidence-native-input"
              type="file"
              onChange={(event) => setEvidenceFile(event.target.files[0] || null)}
            />
            <span className="goal-evidence-file-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <path d="m17 8-5-5-5 5M12 3v12" />
              </svg>
            </span>
            <span className="goal-evidence-file-copy">
              <strong>2. Supporting evidence</strong>
              <small>{evidenceFile?.name || "PDF, document or image"}</small>
            </span>
            <span className="goal-evidence-choose">{evidenceFile ? "Change" : "Choose file"}</span>
          </label>
        </div>

        <footer className="goal-evidence-footer">
          <span className={error ? "goal-evidence-error" : ""}>{error || (filesReady ? "Both files are ready" : "Select both files to continue")}</span>
          <button
            type="button"
            className="goal-evidence-submit-button"
            disabled={!filesReady || isSubmitting}
            onClick={handleSubmitEvidence}
          >
            {isSubmitting ? "Uploading…" : "Submit evidence"}
          </button>
        </footer>
      </section>
    </div>
  );
}

export default GoalEvidenceSubmission;
