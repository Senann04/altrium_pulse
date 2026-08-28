import { useEffect, useState } from "react";
import PARMeetingScheduler from "./PARMeetingScheduler";
import {
  getParMeeting,
  refreshParMeeting,
  saveParMeeting,
  subscribeToParMeeting,
} from "../services/parMeetingStorage";
import "../styles/parmeeting.css";

/* Shared PAR Meeting card. Supervisor can open the scheduler to set it;
   Employee sees the same record read-only. role: "supervisor" | "employee" */
function PARMeeting({ role, reviewId, employeeId }) {
  const [meeting, setMeeting] = useState(getParMeeting());
  const [isSchedulerOpen, setIsSchedulerOpen] = useState(false);

  useEffect(() => {
    refreshParMeeting(reviewId).catch((error) =>
      console.error("Unable to load PAR meeting", error),
    );
    return subscribeToParMeeting(() => setMeeting(getParMeeting()));
  }, [reviewId]);

  const handleSave = async (newMeeting) => {
    try {
      await saveParMeeting(
        { ...newMeeting, status: "Scheduled" },
        { reviewId, employeeId },
      );
      setIsSchedulerOpen(false);
    } catch (error) {
      console.error("Unable to schedule PAR meeting", error);
    }
  };

  const dateLabel = meeting ? meeting.date : "Pending...";
  const timeLabel = meeting ? meeting.time : "Pending...";
  const status = meeting ? meeting.status : "Pending";
  const canSchedule = role === "supervisor";

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
        <span className="par-meeting-icon" aria-hidden="true">📅</span>
        <span>{dateLabel}</span>
      </button>

      <button
        type="button"
        className="par-meeting-row"
        disabled={!canSchedule}
        onClick={() => canSchedule && setIsSchedulerOpen(true)}
      >
        <span className="par-meeting-icon" aria-hidden="true">🕒</span>
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
