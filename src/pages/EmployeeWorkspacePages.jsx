import { useEffect, useMemo, useState } from "react";
import Header from "../components/header";
import Sidebar from "../components/sidebar";
import WorkspaceHeading from "../components/WorkspaceHeading";
import { loadVisibleProjects } from "../services/performanceWorkflowService";
import { beginGoogleCalendarConnection, createPersonalCalendarEvent, disconnectGoogleCalendar, getGoogleCalendarConnection, googleCalendarUrl, listPersonalCalendarEvents, syncEventToGoogle } from "../services/calendarService";
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

function ProjectPortfolio() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    loadVisibleProjects()
      .then((rows) => { if (active) setProjects(rows); })
      .catch((loadError) => { if (active) setError(loadError.message || "Unable to load projects."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  if (loading) return <p className="hr-admin-state">Loading project access…</p>;
  if (error) return <p className="hr-admin-state is-error" role="alert">{error}</p>;
  if (!projects.length) {
    return (
      <div className="employee-workspace-empty">
        <span className="employee-workspace-empty-icon"><PageIcon type="projects" /></span>
        <div><h3>No projects assigned</h3><p>Your team-based access still applies. Project records will appear only after a project membership or HRBP project assignment is recorded.</p></div>
      </div>
    );
  }

  return (
    <div className="project-portfolio-grid">
      {projects.map((project) => (
        <article className="project-portfolio-card" key={project.id}>
          <header>
            <div><span>{project.code}</span><h3>{project.name}</h3></div>
            <span className={`project-status project-status-${project.status}`}>{project.status}</span>
          </header>
          <p>{project.description || "No project description has been added."}</p>
          <dl>
            <div><dt>Business unit</dt><dd>{project.departmentName}</dd></div>
            <div><dt>Schedule</dt><dd>{project.start_date || "Not set"} – {project.end_date || "Ongoing"}</dd></div>
          </dl>
          <div className="project-member-list">
            <span>Visible members</span>
            {project.members.map((member) => (
              <div key={member.id}><strong>{member.full_name}</strong><small>{member.responsibility}</small></div>
            ))}
            {!project.members.length && <small>No visible members in your access scope.</small>}
          </div>
        </article>
      ))}
    </div>
  );
}

function EmployeeWorkspacePage({ view, role = "employee", onNavigate, onSignOut, profileData }) {
  const content = pageContent[view];
  const cycleLabel = profileData?.parCycle || "Current PAR cycle";
  const completedReviews = view === "history" ? profileData?.completedReviews || [] : [];
  const workspaceLabel = role === "supervisor"
    ? "Supervisor workspace"
    : role === "hrbp"
      ? "People operations workspace"
      : "Employee workspace";
  const emptyDescription = role === "hrbp" && view === "projects"
    ? "Organisation-wide projects connected to review goals will appear here with their owner, deadline and progress."
    : role === "supervisor" && view === "projects"
      ? "Projects assigned to you will appear here with their owner, deadline and progress."
      : content.emptyDescription;

  return (
    <div className="app-shell">
      <Sidebar role={role} activeItem={view} onNavigate={onNavigate} onSignOut={onSignOut} profileData={profileData} />
      <main className="app-main employee-workspace-page">
        <Header title={content.title} profileData={profileData} />
        <WorkspaceHeading eyebrow={content.eyebrow} title={content.title} description={content.description} />

        <section className="employee-workspace-panel">
          <div className="employee-workspace-panel-heading">
            <div><span>{workspaceLabel}</span><h2>{content.title}</h2></div>
            <span className="employee-workspace-cycle">{cycleLabel}</span>
          </div>
          {view === "projects" ? (
            <ProjectPortfolio />
          ) : completedReviews.length ? (
            <div className="employee-history-list">
              {completedReviews.map((review) => (
                <article className="employee-history-item" key={review.id}>
                  <span className="employee-history-icon"><PageIcon type="history" /></span>
                  <div className="employee-history-copy">
                    <strong>{review.cycleName}</strong>
                    <span>{review.startDate} – {review.endDate}</span>
                    <small>Completed {review.completedAt}</small>
                    <details className="employee-history-detail">
                      <summary>View review summary</summary>
                      <p><b>Supervisor:</b> {review.supervisorSummary || "No supervisor summary recorded."}</p>
                      <p><b>HR outcome:</b> {review.hrComments || "No HR outcome note recorded."}</p>
                    </details>
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
              <div><h3>{content.emptyTitle}</h3><p>{emptyDescription}</p></div>
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

function calendarDateTime(date, time = "09:00") {
  if (!date) return "";
  const twelveHour = String(time).trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (twelveHour) {
    let hour = Number(twelveHour[1]) % 12;
    if (twelveHour[3].toUpperCase() === "PM") hour += 12;
    return `${date}T${String(hour).padStart(2, "0")}:${twelveHour[2]}:00`;
  }
  const twentyFourHour = String(time).trim().match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (twentyFourHour) return `${date}T${String(Number(twentyFourHour[1])).padStart(2, "0")}:${twentyFourHour[2]}:00`;
  return `${date}T09:00:00`;
}

function EmployeeCalendar({ role = "employee", onNavigate, onSignOut, profileData }) {
  const today = useMemo(() => new Date(), []);
  const [shownMonth, setShownMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [savedEvents, setSavedEvents] = useState([]);
  const [formOpen, setFormOpen] = useState(false);
  const [draft, setDraft] = useState({ title: "", description: "", startsAt: "", endsAt: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [googleConnection, setGoogleConnection] = useState({ connected: false, loading: true });
  const [syncingId, setSyncingId] = useState("");
  const year = shownMonth.getFullYear();
  const month = shownMonth.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const leadingDays = new Date(year, month, 1).getDay();
  const monthLabel = shownMonth.toLocaleDateString("en", { month: "long", year: "numeric" });
  const calendarDays = [
    ...Array.from({ length: leadingDays }, (_, index) => `empty-${index}`),
    ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
  ];
  useEffect(() => {
    let active = true;
    listPersonalCalendarEvents().then((rows) => { if (active) setSavedEvents(rows); }).catch((loadError) => { if (active) setError(loadError.message || "Unable to load your calendar."); });
    return () => { active = false; };
  }, []);
  useEffect(() => {
    let active = true;
    getGoogleCalendarConnection().then((status) => { if (active) setGoogleConnection({ ...status, loading: false }); });
    return () => { active = false; };
  }, []);
  const events = useMemo(() => [
    ...(profileData?.calendarEvents || []).map((event) => ({ ...event, starts_at: calendarDateTime(event.date, event.time), type: event.type || "Review milestone", system: true })),
    ...savedEvents,
  ].map((event) => ({
    ...event,
    date: event.date || event.starts_at.slice(0, 10),
    time: event.time || new Date(event.starts_at).toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit" }),
    type: event.type || "Personal event",
  })), [profileData?.calendarEvents, savedEvents]);
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
  const isLeadership = role === "leadership";
  const saveEvent = async (event) => {
    event.preventDefault();
    setBusy(true); setError("");
    try {
      const saved = await createPersonalCalendarEvent(draft);
      setSavedEvents((items) => [...items, saved].sort((a, b) => a.starts_at.localeCompare(b.starts_at)));
      if (googleConnection.connected) {
        try {
          const synced = await syncEventToGoogle(saved.id);
          setSavedEvents((items) => items.map((item) => item.id === saved.id ? { ...item, google_event_id: synced.googleEventId, google_html_link: synced.htmlLink } : item));
        } catch (syncError) {
          setError(`Event saved in Altrium, but Google Calendar could not sync it: ${syncError.message}`);
        }
      }
      setDraft({ title: "", description: "", startsAt: "", endsAt: "" });
      setFormOpen(false);
    } catch (saveError) { setError(saveError.message || "Unable to schedule this event."); }
    finally { setBusy(false); }
  };
  const syncEvent = async (eventId) => {
    setSyncingId(eventId); setError("");
    try {
      const synced = await syncEventToGoogle(eventId);
      setSavedEvents((items) => items.map((item) => item.id === eventId ? { ...item, google_event_id: synced.googleEventId, google_html_link: synced.htmlLink } : item));
    } catch (syncError) { setError(syncError.message || "Unable to add this event to Google Calendar."); }
    finally { setSyncingId(""); }
  };
  const disconnectGoogle = async () => {
    setBusy(true); setError("");
    try { await disconnectGoogleCalendar(); setGoogleConnection({ connected: false, configured: true, loading: false }); }
    catch (disconnectError) { setError(disconnectError.message || "Unable to disconnect Google Calendar."); }
    finally { setBusy(false); }
  };

  return (
    <div className="app-shell">
      <Sidebar role={role} activeItem="calendar" onNavigate={onNavigate} onSignOut={onSignOut} profileData={profileData} />
      <main className="app-main employee-workspace-page">
        <Header title="Calendar" profileData={profileData} />
        <WorkspaceHeading
          eyebrow={isLeadership ? "Organisation schedule" : "Schedule"}
          title="Calendar"
          description={isLeadership
            ? "Track organisation-wide review checkpoints and reporting deadlines."
            : "Keep review milestones, meetings and goal deadlines in one place."}
        />

        <div className="employee-calendar-layout">
          <section className="employee-calendar-card" aria-label={monthLabel}>
            <div className="employee-calendar-heading calendar-heading-actions">
              <div><span>Schedule</span><h2>{monthLabel}</h2></div>
              <div><button type="button" aria-label="Previous month" onClick={() => setShownMonth(new Date(year, month - 1, 1))}>‹</button><button type="button" onClick={() => setShownMonth(new Date(today.getFullYear(), today.getMonth(), 1))}>Today</button><button type="button" aria-label="Next month" onClick={() => setShownMonth(new Date(year, month + 1, 1))}>›</button></div>
            </div>
            <div className="employee-calendar-weekdays" aria-hidden="true">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => <span key={day}>{day}</span>)}
            </div>
            <div className="employee-calendar-grid">
              {calendarDays.map((day) => typeof day === "string" ? <span key={day} /> : (
                <span className={`${day === today.getDate() && month === today.getMonth() && year === today.getFullYear() ? "is-today " : ""}${eventDays.has(day) ? "has-event" : ""}`.trim()} key={day}>{day}</span>
              ))}
            </div>
          </section>

          <aside className="employee-calendar-agenda">
            <div className="calendar-agenda-heading"><div><span>Schedule</span><h2>Upcoming</h2></div><button type="button" onClick={() => setFormOpen((open) => !open)}>{formOpen ? "Cancel" : "+ Schedule"}</button></div>
            <section className="google-calendar-connection" aria-label="Google Calendar connection">
              <div><strong>{googleConnection.connected ? "Google Calendar connected" : "Connect Google Calendar"}</strong><span>{googleConnection.connected ? googleConnection.email : "Choose a personal or company Google account."}</span></div>
              {googleConnection.connected
                ? <button type="button" onClick={disconnectGoogle} disabled={busy}>Disconnect</button>
                : <button type="button" onClick={beginGoogleCalendarConnection} disabled={googleConnection.loading || googleConnection.configured === false}>{googleConnection.loading ? "Checking…" : "Connect Google"}</button>}
            </section>
            {formOpen && <form className="calendar-event-form" onSubmit={saveEvent}>
              <label>Event title<input required value={draft.title} onChange={(event) => setDraft((value) => ({ ...value, title: event.target.value }))} /></label>
              <label>Starts<input required type="datetime-local" value={draft.startsAt} onInput={(event) => setDraft((value) => ({ ...value, startsAt: event.currentTarget.value }))} /></label>
              <label>Ends<input type="datetime-local" value={draft.endsAt} onInput={(event) => setDraft((value) => ({ ...value, endsAt: event.currentTarget.value }))} /></label>
              <label>Notes<textarea value={draft.description} onChange={(event) => setDraft((value) => ({ ...value, description: event.target.value }))} /></label>
              <button type="submit" disabled={busy}>{busy ? "Scheduling…" : "Save event"}</button>
            </form>}
            {error && <p className="hr-admin-inline-error" role="alert">{error}</p>}
            {upcomingEvents.length ? (
              <div className="employee-calendar-event-list">
                {upcomingEvents.map((event) => (
                  <article className="employee-calendar-event" key={event.id}>
                    <time dateTime={event.date}>
                      <strong>{event.date.slice(-2)}</strong>
                      <span>{new Date(`${event.date}T00:00:00`).toLocaleDateString("en", { month: "short" }).toUpperCase()}</span>
                    </time>
                    <div><strong>{event.title}</strong><span>{event.type}{event.time ? ` · ${event.time}` : ""}</span>{event.google_html_link ? <a href={event.google_html_link} target="_blank" rel="noopener noreferrer">Open in Google Calendar</a> : googleConnection.connected && !event.system ? <button type="button" className="calendar-sync-link" onClick={() => syncEvent(event.id)} disabled={syncingId === event.id}>{syncingId === event.id ? "Adding…" : "Add to connected calendar"}</button> : <a href={googleCalendarUrl(event)} target="_blank" rel="noopener noreferrer">Add to Google Calendar</a>}</div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="employee-workspace-empty compact">
                <span className="employee-workspace-empty-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="5.5" width="17" height="15" rx="2.5" /><path d="M7.5 3.5v4M16.5 3.5v4M3.5 9.5h17" /></svg></span>
                <div><h3>No events scheduled</h3><p>{isLeadership ? "Organisation-wide review milestones will appear here." : "Your review meetings and deadlines will appear here."}</p></div>
              </div>
            )}
          </aside>
        </div>
      </main>
    </div>
  );
}

function SupervisorProjects(props) {
  return <EmployeeWorkspacePage {...props} role="supervisor" view="projects" />;
}

function HRBPProjects({ onNavigate, onSignOut, profileData }) {
  const members = profileData?.teamMembers || [];
  const assignedTeams = profileData?.assignedTeams || [];
  const assignedProjects = profileData?.assignedProjects || [];
  const scopeLabel = assignedTeams.length ? assignedTeams.join(", ") : "No teams assigned";

  return (
    <div className="app-shell">
      <Sidebar role="hrbp" activeItem="projects" onNavigate={onNavigate} onSignOut={onSignOut} profileData={profileData} />
      <main className="app-main employee-workspace-page">
        <Header title="Projects" profileData={profileData} />
        <WorkspaceHeading
          eyebrow="Access scope"
          title="Projects"
          description="See the teams and employee records available to your HRBP account."
        />

        <section className="hrbp-scope-panel">
          <div className="hrbp-scope-heading">
            <div><span>Assigned teams</span><h2>{scopeLabel}</h2></div>
            <strong>{members.length} employees · {assignedTeams.length} {assignedTeams.length === 1 ? "team" : "teams"} · {assignedProjects.length} {assignedProjects.length === 1 ? "project" : "projects"}</strong>
          </div>
          <div className="hrbp-scope-member-grid">
            {members.map((member) => (
              <article key={member.id}>
                <span className="hrbp-scope-avatar" aria-hidden="true">{member.name.slice(0, 1).toUpperCase()}</span>
                <div><strong>{member.name}</strong><span>{member.employeeNumber} · {member.jobTitle} · {member.department}</span></div>
                <span className="hrbp-scope-status">{member.reviewStatus}</span>
              </article>
            ))}
          </div>
          {!members.length && <p className="hr-admin-state">No employees are assigned to this HRBP account.</p>}
        </section>

        <section className="employee-workspace-panel hrbp-project-state">
          <div className="employee-workspace-panel-heading">
            <div><span>Project access</span><h2>Assigned projects</h2></div>
          </div>
          <ProjectPortfolio />
        </section>
      </main>
    </div>
  );
}

function SupervisorPerformanceHistory(props) {
  return <EmployeeWorkspacePage {...props} role="supervisor" view="history" />;
}

function SupervisorCalendar(props) {
  return <EmployeeCalendar {...props} role="supervisor" />;
}

export {
  EmployeeCalendar,
  EmployeePerformanceHistory,
  EmployeeProjects,
  HRBPProjects,
  SupervisorCalendar,
  SupervisorPerformanceHistory,
  SupervisorProjects,
};
