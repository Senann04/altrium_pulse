import { useState } from "react";
import { updateOwnGoalProgress } from "../services/performanceWorkflowService";
import "../styles/assignedgoalrow.css";

function AssignedGoalRow({ goal, onSaved }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(goal.progress));
  const [progress, setProgress] = useState(goal.progress);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const valid = draft.trim() !== "" && Number.isInteger(Number(draft)) && Number(draft) >= 0 && Number(draft) <= 100;
  const save = async () => {
    if (!valid) return;
    setBusy(true); setError("");
    try {
      const saved = await updateOwnGoalProgress(goal.id, Number(draft));
      setProgress(saved.progress); setEditing(false);
      await onSaved?.();
    } catch (err) { setError(err.message || "Unable to save progress."); }
    finally { setBusy(false); }
  };
  return <div className="time-goal-progress">
    <div className="assigned-goal-row"><span className="assigned-goal-row-text">{goal.goal}</span><span className="assigned-goal-row-pill">{progress}%</span></div>
    {editing ? <div className="time-goal-editor">
      <label>Progress (%)<input type="number" min="0" max="100" step="1" value={draft} disabled={busy} onChange={e=>setDraft(e.target.value)} /></label>
      <button type="button" disabled={busy || !valid} onClick={save}>{busy ? "Saving…" : "Save progress"}</button>
      <button type="button" disabled={busy} onClick={()=>setEditing(false)}>Cancel</button>
    </div> : <button type="button" onClick={()=>{setDraft(String(progress));setError("");setEditing(true);}}>Update progress</button>}
    {error && <p role="alert">{error}</p>}
  </div>;
}
export default AssignedGoalRow;
