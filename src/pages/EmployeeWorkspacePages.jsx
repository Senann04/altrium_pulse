import { useMemo, useState } from "react";
import Header from "../components/header";
import Sidebar from "../components/sidebar";
import WorkspaceHeading from "../components/WorkspaceHeading";
import { SELF_ASSESSMENT_QUESTIONS } from "../services/reviewService";
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
              <div><h3>{content.emptyTitle}</h3><p>{emptyDescription}</p></div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function EmployeeAchievementJourney({ onNavigate, onSignOut, profileData }) {
  const journey = useMemo(() => profileData?.performanceJourney || [], [profileData?.performanceJourney]);
  const years = useMemo(
    () => [...new Set(journey.map((cycle) => cycle.year))].sort((left, right) => right - left),
    [journey],
  );
  const [selectedYear, setSelectedYear] = useState(years[0] || new Date().getFullYear());
  const [expandedId, setExpandedId] = useState(journey[0]?.id || null);
  const visibleCycles = journey.filter((cycle) => cycle.year === Number(selectedYear));
  const goals = visibleCycles.flatMap((cycle) => cycle.goals);
  const completedGoals = goals.filter((goal) => goal.status === "completed").length;
  const evidenceCount = visibleCycles.reduce((sum, cycle) => sum + cycle.evidence.length, 0);

  return (
    <div className="app-shell">
      <Sidebar role="employee" activeItem="history" onNavigate={onNavigate} onSignOut={onSignOut} profileData={profileData} />
      <main className="app-main employee-workspace-page employee-journey-page">
        <Header title="Performance History" profileData={profileData} />
        <WorkspaceHeading
          eyebrow="Achievement record"
          title="My Performance Journey"
          description="Follow your review cycles, self-assessments, goals and submitted evidence as one year-by-year achievement roadmap."
          meta={profileData?.joinedOn ? `Joined ${profileData.joinedOnLabel}` : "Joining date pending"}
        />

        <section className="employee-journey-toolbar">
          <label>Review year<select value={selectedYear} onChange={(event) => setSelectedYear(event.target.value)}>{years.map((year) => <option key={year}>{year}</option>)}</select></label>
          <div className="employee-journey-stats">
            <span><strong>{visibleCycles.length}</strong>Cycles</span>
            <span><strong>{completedGoals}/{goals.length}</strong>Goals achieved</span>
            <span><strong>{evidenceCount}</strong>Evidence files</span>
          </div>
          <button type="button" className="employee-journey-print" onClick={() => window.print()}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9V3h12v6M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v7H6z" /></svg>
            Print year summary
          </button>
        </section>

        {visibleCycles.length ? (
          <section className="employee-journey-timeline" aria-label={`${selectedYear} performance journey`}>
            {visibleCycles.map((cycle, index) => {
              const expanded = expandedId === cycle.id;
              return (
                <article className={`employee-journey-cycle status-${cycle.statusKey}`} key={cycle.id}>
                  <span className="employee-journey-marker"><strong>{String(index + 1).padStart(2, "0")}</strong></span>
                  <div className="employee-journey-card">
                    <button type="button" className="employee-journey-summary" onClick={() => setExpandedId(expanded ? null : cycle.id)} aria-expanded={expanded}>
                      <span><small>{cycle.reviewType}</small><strong>{cycle.cycleName}</strong><em>{cycle.startDate} – {cycle.endDate}</em></span>
                      <span className={`employee-journey-status ${cycle.statusKey}`}>{cycle.status}</span>
                      <span><small>Final rating</small><strong className="employee-journey-rating">{cycle.rating ?? "–"}</strong></span>
                      <svg className={expanded ? "expanded" : ""} viewBox="0 0 24 24" aria-hidden="true"><path d="m7 10 5 5 5-5" /></svg>
                    </button>

                    {expanded && (
                      <div className="employee-journey-details">
                        <section className="employee-journey-section">
                          <div className="employee-journey-section-title"><span>01</span><div><small>Reflection</small><h3>Self-assessment</h3></div></div>
                          <div className="employee-journey-answer-grid">
                            {cycle.selfAssessment.some(Boolean) ? cycle.selfAssessment.map((answer, answerIndex) => answer && (
                              <article key={SELF_ASSESSMENT_QUESTIONS[answerIndex]}><strong>{SELF_ASSESSMENT_QUESTIONS[answerIndex]}</strong><p>{answer}</p></article>
                            )) : <p className="employee-journey-empty-copy">No self-assessment has been submitted for this cycle.</p>}
                          </div>
                        </section>

                        <section className="employee-journey-section">
                          <div className="employee-journey-section-title"><span>02</span><div><small>Achievement roadmap</small><h3>Goals and development</h3></div></div>
                          <div className="employee-journey-goals">
                            {[...cycle.goals, ...cycle.developmentPlans].length ? [...cycle.goals, ...cycle.developmentPlans].map((goal) => (
                              <article key={`${goal.id}-${goal.title}`}>
                                <div><strong>{goal.title}</strong><span>{goal.type || goal.status}{goal.targetDate ? ` · ${goal.targetDate}` : ""}</span></div>
                                <div className="employee-journey-progress"><span style={{ width: `${Math.min(100, Math.max(0, Number(goal.progress) || 0))}%` }} /></div>
                                <strong>{goal.progress ?? 0}%</strong>
                              </article>
                            )) : <p className="employee-journey-empty-copy">No goals or development plans were connected to this cycle.</p>}
                          </div>
                        </section>

                        <section className="employee-journey-section">
                          <div className="employee-journey-section-title"><span>03</span><div><small>Supporting record</small><h3>Submitted evidence</h3></div></div>
                          <div className="employee-journey-files">
                            {cycle.evidence.length ? cycle.evidence.map((file) => (
                              <article key={file.id}>
                                <span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /></svg></span>
                                <div><strong>{file.fileName}</strong><small>{file.kind === "action_item" ? "Action item" : "Supporting evidence"} · {file.uploadedAt}</small></div>
                              </article>
                            )) : <p className="employee-journey-empty-copy">No evidence files have been submitted for this cycle.</p>}
                          </div>
                        </section>
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </section>
        ) : (
          <section className="employee-workspace-panel">
            <div className="employee-workspace-empty"><span className="employee-workspace-empty-icon"><PageIcon type="history" /></span><div><h3>No cycle record for {selectedYear}</h3><p>Once you are eligible and enrolled in a review cycle, its roadmap will appear here automatically.</p></div></div>
          </section>
        )}
      </main>
    </div>
  );
}

function EmployeeProjects(props) {
  return <EmployeeWorkspacePage {...props} view="projects" />;
}

function EmployeePerformanceHistory(props) {
  return <EmployeeAchievementJourney {...props} />;
}

function EmployeeCalendar({ role = "employee", onNavigate, onSignOut, profileData }) {
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
  const isLeadership = role === "leadership";

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
  const scopeLabel = profileData?.department || "Assigned business unit";

  return (
    <div className="app-shell">
      <Sidebar role="hrbp" activeItem="projects" onNavigate={onNavigate} onSignOut={onSignOut} profileData={profileData} />
      <main className="app-main employee-workspace-page">
        <Header title="Projects" profileData={profileData} />
        <WorkspaceHeading
          eyebrow="Access scope"
          title="Projects"
          description="See the business unit and employee records available to your HRBP account."
        />

        <section className="hrbp-scope-panel">
          <div className="hrbp-scope-heading">
            <div><span>Assigned business unit</span><h2>{scopeLabel}</h2></div>
            <strong>{members.length} employees in scope</strong>
          </div>
          <div className="hrbp-scope-member-grid">
            {members.map((member) => (
              <article key={member.id}>
                <span className="hrbp-scope-avatar" aria-hidden="true">{member.name.slice(0, 1).toUpperCase()}</span>
                <div><strong>{member.name}</strong><span>{member.employeeNumber} · {member.jobTitle}</span></div>
                <span className="hrbp-scope-status">{member.reviewStatus}</span>
              </article>
            ))}
          </div>
          {!members.length && <p className="hr-admin-state">No employees are assigned to this HRBP account.</p>}
        </section>

        <section className="hrbp-project-state">
          <span className="employee-workspace-empty-icon"><PageIcon type="projects" /></span>
          <div>
            <span>Project access</span>
            <h2>No project assignments recorded</h2>
            <p>The current system scopes this HRBP account by business unit. Project-level access will appear here when project records are added.</p>
          </div>
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
