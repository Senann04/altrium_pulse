import { useState } from "react";
import { listGoalEvidence, createGoalEvidenceDownloadUrl } from "../services/goalEvidenceService";
import "../styles/plan-evidence-list.css";

export default function PlanEvidenceList({ planId }) {
  const [files, setFiles] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const load = async () => {
    setBusy(true);
    setError("");
    setFiles(null);
    try {
      const records = await listGoalEvidence(planId);
      const links = await Promise.all(records.map(async (file) => ({
        ...file,
        viewUrl: await createGoalEvidenceDownloadUrl(file.object_path),
        downloadUrl: await createGoalEvidenceDownloadUrl(file.object_path, 300, file.file_name),
      })));
      setFiles(links);
    } catch (err) {
      setError(err.message || "Unable to load evidence. Please retry.");
    } finally {
      setBusy(false);
    }
  };
  return <section className="plan-evidence-list" aria-label="Plan evidence">
    <div className="plan-evidence-heading"><strong>Submitted evidence</strong>
      <button type="button" onClick={load} disabled={busy}>{busy ? "Loading evidence…" : files ? "Refresh evidence" : "View evidence"}</button>
    </div>
    {error && <p role="alert">{error}</p>}
    {files?.length === 0 && <p>No evidence has been uploaded for this plan.</p>}
    {!!files?.length && <>
      <p>Links expire after five minutes. Refresh to open them again.</p>
      <ul>{files.map((file) => <li key={file.id}>
        <div><strong>{file.file_name}</strong><small>{file.kind === "action_item" ? "Action item" : "Supporting evidence"} · {Math.max(1, Math.ceil(file.size_bytes / 1024))} KB · {new Date(file.created_at).toLocaleDateString()}</small></div>
        <div className="plan-evidence-links"><a href={file.viewUrl} target="_blank" rel="noopener noreferrer">View<span className="evidence-sr-only"> {file.file_name}</span></a><a href={file.downloadUrl} target="_blank" rel="noopener noreferrer">Download<span className="evidence-sr-only"> {file.file_name}</span></a></div>
      </li>)}</ul>
    </>}
  </section>;
}
