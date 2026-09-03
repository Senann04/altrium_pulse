import Header from "../components/header";
import Sidebar from "../components/sidebar";
import WorkspaceHeading from "../components/WorkspaceHeading";
import "../styles/appshell.css";
import "../styles/employeeworkspacepages.css";

const pageContent = {
  projects: {
    eyebrow: "Work portfolio",
    title: "Projects",
    description: "View the projects connected to your goals and performance plan.",
    emptyTitle: "No projects assigned",
    emptyDescription: "Projects assigned by your supervisor will appear here with their owner, deadline and progress.",
  },
  history: {
    eyebrow: "Performance record",
    title: "Performance History",
    description: "Review completed cycles and track how your performance has developed over time.",
    emptyTitle: "No completed cycles yet",
    emptyDescription: "Your completed review cycles and final ratings will be listed here.",
  },
};

function PageIcon({ type }) {
  if (type === "history") {
    return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5v5h5" /><path d="M5.3 9A8.5 8.5 0 1 1 4 14" /><path d="M12 7.5V12l3 2" /></svg>;
  }
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m4 7 8-4 8 4-8 4-8-4Z" /><path d="m4 7 8 4 8-4v10l-8 4-8-4V7Z" /><path d="M12 11v10" /></svg>;
}

function EmployeeWorkspacePage({ view, onNavigate, onSignOut, profileData }) {
  const content = pageContent[view];
  const cycleLabel = profileData?.parCycle || "Current PAR cycle";
  const completedReviews = view === "history" ? profileData?.completedReviews || [] : [];

  return (
    <div className="app-shell">
      <Sidebar role="employee" activeItem={view} onNavigate={onNavigate} onSignOut={onSignOut} profileData={profileData} />
      <main className="app-main employee-workspace-page">
        <Header title={content.title} profileData={profileData} />
        <WorkspaceHeading eyebrow={content.eyebrow} title={content.title} description={content.description} />

        <section className="employee-workspace-panel">
          <div className="employee-workspace-panel-heading">
            <div><span>Employee workspace</span><h2>{content.title}</h2></div>
            <span className="employee-workspace-cycle">{cycleLabel}</span>
          </div>
          {completedReviews.length ? (
            <div className="employee-history-list">
              {completedReviews.map((review) => (
                <article className="employee-history-item" key={review.id}>
                  <span className="employee-history-icon"><PageIcon type="history" /></span>
                  <div className="employee-history-copy">
                    <strong>{review.cycleName}</strong>
                    <span>{review.startDate} – {review.endDate}</span>
                    <small>Completed {review.completedAt}</small>
                  </div>
                  <div className="employee-history-rating">
                    <span>Final rating</span>
                    <strong>{review.rating ?? "–"}</strong>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="employee-workspace-empty">
              <span className="employee-workspace-empty-icon"><PageIcon type={view} /></span>
              <div><h3>{content.emptyTitle}</h3><p>{content.emptyDescription}</p></div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function EmployeeProjects(props) {
  return <EmployeeWorkspacePage {...props} view="projects" />;
}

function EmployeePerformanceHistory(props) {
  return <EmployeeWorkspacePage {...props} view="history" />;
}

function EmployeeCalendar({ onNavigate, onSignOut, profileData }) {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const leadingDays = new Date(year, month, 1).getDay();
  const monthLabel = today.toLocaleDateString("en", { month: "long", year: "numeric" });
  const calendarDays = [
    ...Array.from({ length: leadingDays }, (_, index) => `empty-${index}`),
    ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
  ];
  const events = profileData?.calendarEvents || [];
  const todayValue = today.toISOString().slice(0, 10);
  const upcomingEvents = events.filter((event) => event.date >= todayValue);
  const eventDays = new Set(
    events
      .filter((event) => {
        const date = new Date(`${event.date}T00:00:00`);
        return date.getFullYear() === year && date.getMonth() === month;
      })
      .map((event) => Number(event.date.slice(-2))),
  );

  return (
    <div className="app-shell">
      <Sidebar role="employee" activeItem="calendar" onNavigate={onNavigate} onSignOut={onSignOut} profileData={profileData} />
      <main className="app-main employee-workspace-page">
        <Header title="Calendar" profileData={profileData} />
        <WorkspaceHeading eyebrow="Schedule" title="Calendar" description="Keep review milestones, meetings and goal deadlines in one place." />

        <div className="employee-calendar-layout">
          <section className="employee-calendar-card" aria-label={monthLabel}>
            <div className="employee-calendar-heading"><span>Current month</span><h2>{monthLabel}</h2></div>
            <div className="employee-calendar-weekdays" aria-hidden="true">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => <span key={day}>{day}</span>)}
            </div>
            <div className="employee-calendar-grid">
              {calendarDays.map((day) => typeof day === "string" ? <span key={day} /> : (
                <span className={`${day === today.getDate() ? "is-today " : ""}${eventDays.has(day) ? "has-event" : ""}`.trim()} key={day}>{day}</span>
              ))}
            </div>
          </section>

          <aside className="employee-calendar-agenda">
            <div><span>Schedule</span><h2>Upcoming</h2></div>
            {upcomingEvents.length ? (
              <div className="employee-calendar-event-list">
                {upcomingEvents.map((event) => (
                  <article className="employee-calendar-event" key={event.id}>
                    <time dateTime={event.date}>
                      <strong>{event.date.slice(-2)}</strong>
                      <span>{new Date(`${event.date}T00:00:00`).toLocaleDateString("en", { month: "short" }).toUpperCase()}</span>
                    </time>
                    <div><strong>{event.title}</strong><span>{event.type}{event.time ? ` · ${event.time}` : ""}</span></div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="employee-workspace-empty compact">
                <span className="employee-workspace-empty-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="5.5" width="17" height="15" rx="2.5" /><path d="M7.5 3.5v4M16.5 3.5v4M3.5 9.5h17" /></svg></span>
                <div><h3>No events scheduled</h3><p>Your review meetings and deadlines will appear here.</p></div>
              </div>
            )}
          </aside>
        </div>
      </main>
    </div>
  );
}

export { EmployeeCalendar, EmployeePerformanceHistory, EmployeeProjects };
