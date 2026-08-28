import "../styles/header.css";
import altriumLogo from "../assets/altriumlogo.svg";

/*TEMPORARY calendar and time values.
Backend team will connect Google Calendar later and to be replaced these
two constants with real data once that integration exists.*/

const TEMP_TIME = "11:40";
const TEMP_DATE = {
  day: "08",
  month: "August 2026",
  weekday: "Thursday",
};

function Header() {
  return (
    <header className="header">
      {/* Altrium logo (real asset, not recreated) */}
        <img src={altriumLogo} alt="Altrium logo" className="header-logo" />

      <div className="header-right">
        {/* Notification bell — visual only, no logic yet */}
        <div className="notification-circle" aria-label="Notifications">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#111111" strokeWidth="2">
            <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
        </div>

        {/* Time pill — TEMP_TIME is the placeholder value */}
        <div className="time-pill">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#111111" strokeWidth="2">
            <circle cx="12" cy="12" r="9" />
            <polyline points="12 7 12 12 15 15" />
          </svg>
          <span>{TEMP_TIME}</span>
        </div>

        {/* Date/calendar circle — TEMP_DATE is the placeholder value */}
        <div className="date-circle">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#111111" strokeWidth="2">
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          <span className="date-day">{TEMP_DATE.day}</span>
          <span className="date-month">{TEMP_DATE.month}</span>
          <span className="date-weekday">{TEMP_DATE.weekday}</span>
        </div>
      </div>
    </header>
  );
}

export default Header;