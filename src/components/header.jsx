import { useEffect, useState } from "react";
import "../styles/header.css";

function formatClock(date) {
  return new Intl.DateTimeFormat("en", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

function Header({ title = "Performance workspace", profileData }) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const firstName = profileData?.name?.trim().split(/\s+/)[0];
  const day = String(now.getDate()).padStart(2, "0");
  const month = now.toLocaleDateString("en", { month: "short" });
  const weekday = now.toLocaleDateString("en", { weekday: "long" });

  return (
    <header className="header">
      <div className="header-context">
        <span className="header-kicker">Altrium Pulse</span>
        <h1>{firstName ? `Good to see you, ${firstName}` : title}</h1>
      </div>

      <div className="header-right">
        <div className="header-status"><span /> Systems operational</div>
        <div className="time-pill" aria-label={`Current time ${formatClock(now)}`}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3 2" />
          </svg>
          <span>{formatClock(now)}</span>
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
