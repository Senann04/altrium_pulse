import { useState } from "react";
import PARMeetingScheduler from "./PARMeetingScheduler";
import { saveParMeeting } from "../services/workflowService";
import "../styles/parmeeting.css";

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3.5" y="5.5" width="17" height="15" rx="2.5" />
      <path d="M7.5 3.5v4M16.5 3.5v4M3.5 9.5h17" />
      <path d="M8 13h2M14 13h2M8 17h2M14 17h2" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5v5l3.5 2" />
    </svg>
  );
}

/* Shared PAR Meeting card. Supervisor can open the scheduler to set it;
   Employee sees the same record read-only. role: "supervisor" | "employee" */
function PARMeeting({ role, meeting: meetingProp = null, reviewId = null }) {
  const [savedMeeting, setSavedMeeting] = useState(null);
  const [isSchedulerOpen, setIsSchedulerOpen] = useState(false);
  const [error, setError] = useState("");
  const meeting = savedMeeting || meetingProp;

  const handleSave = async (newMeeting) => {
    try {
      setError("");
      const saved = await saveParMeeting(newMeeting, { reviewId });
      setSavedMeeting(saved);
      setIsSchedulerOpen(false);
    } catch (saveError) {
      setError(saveError.message || "Unable to schedule this meeting.");
    }
  };

  const dateLabel = meeting ? meeting.date : "Pending...";
  const timeLabel = meeting ? meeting.time : "Pending...";
  const status = meeting ? meeting.status : "Pending";
  const canSchedule = role === "supervisor" && Boolean(reviewId);

  return (
    <div className="par-meeting-card">
      <div className="par-meeting-header">
        <h2>PAR Meeting</h2>
        <span className="par-meeting-status-pill">{status}</span>
      </div>

      <button
        type="button"
        className="par-meeting-row"
        disabled={!canSchedule}
        onClick={() => canSchedule && setIsSchedulerOpen(true)}
      >
        <span className="par-meeting-icon"><CalendarIcon /></span>
        <span>{dateLabel}</span>
      </button>

      {error && <p className="par-meeting-error" role="alert">{error}</p>}

      <button
        type="button"
        className="par-meeting-row"
        disabled={!canSchedule}
        onClick={() => canSchedule && setIsSchedulerOpen(true)}
      >
        <span className="par-meeting-icon"><ClockIcon /></span>
        <span>{timeLabel}</span>
      </button>

      {canSchedule && (
        <PARMeetingScheduler
          isOpen={isSchedulerOpen}
          onClose={() => setIsSchedulerOpen(false)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}

export default PARMeeting;
