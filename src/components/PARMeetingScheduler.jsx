import { useState } from "react";
import "../styles/parmeetingscheduler.css";

const WEEKDAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];

/* builds a real month grid (Monday-first) for the given year/month */
function getMonthDays(year, month) {
  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days = Array(firstWeekday).fill(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(d);
  return days;
}

function PARMeetingScheduler({ isOpen, onClose, onSave }) {
  const today = new Date();
  const [selectedDay, setSelectedDay] = useState(null);
  const [hour, setHour] = useState("00");
  const [minute, setMinute] = useState("00");

  if (!isOpen) return null;

  const year = today.getFullYear();
  const month = today.getMonth();
  const days = getMonthDays(year, month);

  const handleOk = () => {
    if (!selectedDay) return;
    const date = new Date(year, month, selectedDay);
    onSave({ date: date.toISOString().slice(0, 10), time: `${hour}:${minute}` });
  };

  return (
    <div className="par-scheduler-overlay" onClick={onClose}>
      <div className="par-scheduler-modal" onClick={(e) => e.stopPropagation()}>
        <h2 className="par-scheduler-title">Set the Date</h2>

        <div className="par-scheduler-weekdays">
          {WEEKDAY_LABELS.map((label, i) => (
            <span key={i} className="par-scheduler-weekday">{label}</span>
          ))}
        </div>

        <div className="par-scheduler-grid">
          {days.map((day, i) =>
            day ? (
              <button
                key={i}
                type="button"
                className={`par-scheduler-day${selectedDay === day ? " selected" : ""}`}
                onClick={() => setSelectedDay(day)}
              >
                {day}
              </button>
            ) : (
              <span key={i} className="par-scheduler-day-empty" />
            )
          )}
        </div>

        <div className="par-scheduler-footer">
          <div className="par-scheduler-time">
            <span>Set time</span>
            <select value={hour} onChange={(e) => setHour(e.target.value)}>
              {Array.from({ length: 24 }, (_, h) => String(h).padStart(2, "0")).map((h) => (
                <option key={h} value={h}>{h}</option>
              ))}
            </select>
            <select value={minute} onChange={(e) => setMinute(e.target.value)}>
              {Array.from({ length: 60 }, (_, m) => String(m).padStart(2, "0")).map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
          <button type="button" className="par-scheduler-ok" onClick={handleOk}>
            OK
          </button>
        </div>
      </div>
    </div>
  );
}

export default PARMeetingScheduler;
