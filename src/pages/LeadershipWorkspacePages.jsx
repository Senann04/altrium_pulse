import Header from "../components/header";
import Sidebar from "../components/sidebar";
import SpotlightCard from "../components/SpotlightCard";
import WorkspaceHeading from "../components/WorkspaceHeading";
import { EmployeeCalendar } from "./EmployeeWorkspacePages";
import "../styles/appshell.css";
import "../styles/leadershipworkspace.css";

const REPORT_ICON = (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
  </svg>
);

const RATING_ICON = (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="m12 3 2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.3-4.1 5.9-.9L12 3Z" />
  </svg>
);

const PRIVACY_ICON = (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <rect x="4" y="10" width="16" height="11" rx="3" />
    <path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3" />
  </svg>
);

const STATUS_ICONS = {
  Completed: <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 4 4L19 6" /></svg>,
  "In progress": <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8" /><path d="M12 8v4l3 2" /></svg>,
  "Not started": <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8" /><path d="M8 12h8" /></svg>,
};

const METRIC_SPOTLIGHTS = {
  gold: "rgba(252, 180, 0, 0.14)",
  green: "rgba(103, 211, 145, 0.12)",
  blue: "rgba(105, 167, 255, 0.12)",
  red: "rgba(255, 124, 124, 0.12)",
};

function percentageLabel(value) {
  return Number.isFinite(Number(value)) ? `${Math.round(Number(value))}%` : "–";
}

function PrivacyNotice() {
  return (
    <aside className="leadership-privacy-note">
      <span>{PRIVACY_ICON}</span>
      <div>
        <strong>Aggregate reporting only</strong>
        <p>Individual review answers, confidential comments and employee assessments are not available in this workspace.</p>
      </div>
    </aside>
  );
}

function MetricCard({ icon, label, value, detail, tone = "gold", progress }) {
  const meterValue = Math.min(100, Math.max(0, Number(progress) || 0));
  return (
    <SpotlightCard className={`leadership-metric leadership-metric-${tone}`} spotlightColor={METRIC_SPOTLIGHTS[tone]}>
      <span className="leadership-metric-icon">{icon}</span>
      <div className="leadership-metric-copy"><span>{label}</span><strong>{value}</strong><small>{detail}</small></div>
      <span className="leadership-metric-meter" aria-hidden="true"><i style={{ width: `${meterValue}%` }} /></span>
    </SpotlightCard>
  );
}

function ProgrammeCard({ label, value, detail, code }) {
  const progress = Math.min(100, Math.max(0, Number(value) || 0));
  return (
    <SpotlightCard className="leadership-programme-card" spotlightColor="rgba(252, 180, 0, 0.12)">
      <span className="leadership-programme-code">{code}</span>
      <div className="leadership-programme-copy"><strong>{label}</strong><span>{detail}</span></div>
      <div className="leadership-programme-ring" style={{ "--programme-progress": `${progress * 3.6}deg` }}>
        <div><strong>{progress}%</strong><span>average</span></div>
      </div>
      <div className="leadership-progress-track" role="progressbar" aria-label={label} aria-valuemin="0" aria-valuemax="100" aria-valuenow={progress}>
        <span style={{ width: `${progress}%` }} />
      </div>
    </SpotlightCard>
  );
}

function ReviewStatusCard({ item, total }) {
  const tone = item.label === "Completed" ? "green" : item.label === "In progress" ? "gold" : "neutral";
  const share = total ? Math.round((Number(item.count) / total) * 100) : 0;
  return (
    <div className={`leadership-status-card leadership-status-${tone}`}>
      <span className="leadership-status-icon">{STATUS_ICONS[item.label]}</span>
      <div><span>{item.label}</span><strong>{item.count}</strong><small>{share}% of cycle</small></div>
      <span className="leadership-status-meter" aria-hidden="true"><i style={{ width: `${share}%` }} /></span>
    </div>
  );
}

function LeadershipPageShell({ activeItem, title, eyebrow, description, profileData, onNavigate, onSignOut, children }) {
  return (
    <div className="app-shell">
      <Sidebar role="leadership" activeItem={activeItem} onNavigate={onNavigate} onSignOut={onSignOut} profileData={profileData} />
      <main className="app-main leadership-workspace">
        <Header title={title} profileData={profileData} />
        <WorkspaceHeading eyebrow={eyebrow} title={title} description={description} meta={profileData?.parCycle || "Organisation view"} />
        {children}
      </main>
    </div>
  );
}

function LeadershipFeedback({ onNavigate, onSignOut, profileData }) {
  const metrics = profileData?.organisationMetrics || {};
  const reviewStatuses = metrics.reviewStatuses || [];
  const ratingDistribution = metrics.ratingDistribution || [];
  const largestRatingGroup = Math.max(1, ...ratingDistribution.map((item) => Number(item.count) || 0));

  return (
    <LeadershipPageShell
      activeItem="feedback"
      title="My Feedback"
      eyebrow="Organisation insights"
      description="Review participation, outcomes and rating trends without opening confidential employee reviews."
      profileData={profileData}
      onNavigate={onNavigate}
      onSignOut={onSignOut}
    >
      <PrivacyNotice />

      <section className="leadership-metric-grid" aria-label="Organisation review statistics">
        <MetricCard icon={REPORT_ICON} label="Review completion" value={percentageLabel(metrics.reviewCompletion)} detail={`${metrics.reviewCompleted || 0} of ${metrics.reviewTotal || 0} completed`} progress={metrics.reviewCompletion} />
        <MetricCard icon={REPORT_ICON} label="Feedback participation" value={percentageLabel(metrics.feedbackParticipation)} detail={`${metrics.feedbackSubmitted || 0} of ${metrics.feedbackAssigned || 0} submitted`} tone="green" progress={metrics.feedbackParticipation} />
        <MetricCard icon={RATING_ICON} label="Average rating" value={metrics.averageRating ?? "–"} detail="Across completed reviews" tone="blue" progress={(Number(metrics.averageRating) / 5) * 100} />
      </section>

      <div className="leadership-report-grid">
        <section className="leadership-report-panel">
          <div className="leadership-panel-heading"><span>Review statistics</span><h2>Current cycle status</h2></div>
          <div className="leadership-status-list">
            {reviewStatuses.map((item) => <ReviewStatusCard item={item} total={Number(metrics.reviewTotal) || 0} key={item.label} />)}
            {!reviewStatuses.length && <p className="leadership-empty-state">No review-cycle statistics are available yet.</p>}
          </div>
        </section>

        <section className="leadership-report-panel">
          <div className="leadership-panel-heading"><span>Organisation trend</span><h2>Rating distribution</h2></div>
          <div className="leadership-rating-chart">
            {ratingDistribution.map((item) => (
              <div className="leadership-rating-row" key={item.label}>
                <span>{item.label}</span>
                <div><i style={{ width: `${(Number(item.count) / largestRatingGroup) * 100}%` }} /></div>
                <strong>{item.count}</strong>
              </div>
            ))}
            {!ratingDistribution.length && <p className="leadership-empty-state">Rating trends will appear after reviews are completed.</p>}
          </div>
        </section>
      </div>
    </LeadershipPageShell>
  );
}

function LeadershipProjects({ onNavigate, onSignOut, profileData }) {
  const metrics = profileData?.organisationMetrics || {};

  return (
    <LeadershipPageShell
      activeItem="projects"
      title="Projects"
      eyebrow="Performance portfolio"
      description="Monitor organisation-wide goal delivery and development-plan health through aggregate progress reports."
      profileData={profileData}
      onNavigate={onNavigate}
      onSignOut={onSignOut}
    >
      <PrivacyNotice />

      <section className="leadership-metric-grid" aria-label="Organisation portfolio summary">
        <MetricCard icon={REPORT_ICON} label="Average goal progress" value={percentageLabel(metrics.goalProgress)} detail={`${metrics.goalTotal || 0} goals in scope`} progress={metrics.goalProgress} />
        <MetricCard icon={REPORT_ICON} label="Goals completed" value={`${metrics.goalCompleted || 0}/${metrics.goalTotal || 0}`} detail="Organisation-wide total" tone="green" progress={metrics.goalTotal ? (Number(metrics.goalCompleted) / Number(metrics.goalTotal)) * 100 : 0} />
        <MetricCard icon={REPORT_ICON} label="Overdue goals" value={String(metrics.goalOverdue || 0).padStart(2, "0")} detail="Requires operational follow-up" tone="red" progress={metrics.goalTotal ? (Number(metrics.goalOverdue) / Number(metrics.goalTotal)) * 100 : 0} />
      </section>

      <section className="leadership-report-panel leadership-portfolio-panel">
        <div className="leadership-panel-heading"><span>Overall progress report</span><h2>Development programmes</h2></div>
        <div className="leadership-progress-list">
          <ProgrammeCard code="PDP" label="Personal Development Plans" value={metrics.pdpProgress} detail="Average completion across the organisation" />
          <ProgrammeCard code="PIP" label="Performance Improvement Plans" value={metrics.pipProgress} detail="Average completion across the organisation" />
        </div>
      </section>
    </LeadershipPageShell>
  );
}

function LeadershipCalendar(props) {
  return <EmployeeCalendar {...props} role="leadership" />;
}

export { LeadershipCalendar, LeadershipFeedback, LeadershipProjects };
