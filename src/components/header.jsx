import "../styles/header.css";

function Header({ title = "Overview", profileData }) {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, "0");
  const month = now.toLocaleDateString("en", { month: "short" });
  const weekday = now.toLocaleDateString("en", { weekday: "long" });
  const cycle = profileData?.parCycle || "Current performance cycle";

  return (
    <header className="header">
      <div className="header-context">
        <span className="header-kicker">Altrium Pulse / Workspace</span>
        <h1>{title}</h1>
      </div>

      <div className="header-right">
        <div className="header-cycle">
          <span><i aria-hidden="true" /> Active cycle</span>
          <strong>{cycle}</strong>
        </div>

        <button type="button" className="notification-button" aria-label="Notifications" title="No new notifications">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.7 21a2 2 0 0 1-3.4 0" />
          </svg>
        </button>

        <div className="date-chip" aria-label={`${weekday}, ${month} ${day}`}>
          <span className="date-chip-day">{day}</span>
          <span><strong>{month}</strong><small>{weekday}</small></span>
        </div>
      </div>
    </header>
  );
}

export default Header;
