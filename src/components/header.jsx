import { useEffect, useRef, useState } from "react";
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
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const notificationAreaRef = useRef(null);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!notificationsOpen) return undefined;
    const closeFromOutside = (event) => {
      if (!notificationAreaRef.current?.contains(event.target)) setNotificationsOpen(false);
    };
    const closeFromKeyboard = (event) => {
      if (event.key === "Escape") setNotificationsOpen(false);
    };
    document.addEventListener("pointerdown", closeFromOutside);
    document.addEventListener("keydown", closeFromKeyboard);
    return () => {
      document.removeEventListener("pointerdown", closeFromOutside);
      document.removeEventListener("keydown", closeFromKeyboard);
    };
  }, [notificationsOpen]);

  const firstName = profileData?.name?.trim().split(/\s+/)[0];
  const day = String(now.getDate()).padStart(2, "0");
  const month = now.toLocaleDateString("en", { month: "short" });
  const weekday = now.toLocaleDateString("en", { weekday: "long" });
  const notifications = profileData?.notifications || [];
  const unreadCount = notifications.filter((notification) => !notification.read_at).length;

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
        <div className="notification-area" ref={notificationAreaRef}>
          <button
            type="button"
            className={`notification-button${notificationsOpen ? " is-open" : ""}`}
            aria-label={`Notifications, ${unreadCount} unread`}
            aria-expanded={notificationsOpen}
            aria-controls="notification-panel"
            title={unreadCount ? `${unreadCount} unread notification${unreadCount === 1 ? "" : "s"}` : "No unread notifications"}
            onClick={() => setNotificationsOpen((open) => !open)}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.7 21a2 2 0 0 1-3.4 0" />
            </svg>
            {unreadCount > 0 && <span className="notification-count">{unreadCount > 9 ? "9+" : unreadCount}</span>}
          </button>

          {notificationsOpen && (
            <section className="notification-panel" id="notification-panel" aria-label="Recent notifications">
              <div className="notification-panel-heading">
                <div><span>Updates</span><strong>Notifications</strong></div>
                <small>{unreadCount} unread</small>
              </div>
              <div className="notification-list">
                {notifications.slice(0, 6).map((notification) => (
                  <article className={`notification-item${notification.read_at ? "" : " is-unread"}`} key={notification.id}>
                    <span className="notification-item-icon" aria-hidden="true">
                      <svg viewBox="0 0 24 24"><path d="M12 3v18M3 12h18" /></svg>
                    </span>
                    <div>
                      <strong>{notification.title}</strong>
                      <p>{notification.message}</p>
                      <small>{notification.createdLabel}</small>
                    </div>
                  </article>
                ))}
                {!notifications.length && <p className="notification-empty">You have no notifications yet.</p>}
              </div>
            </section>
          )}
        </div>
        <div className="date-chip" aria-label={`${weekday}, ${month} ${day}`}>
          <span className="date-chip-day">{day}</span>
          <span><strong>{month}</strong><small>{weekday}</small></span>
        </div>
      </div>
    </header>
  );
}

export default Header;
