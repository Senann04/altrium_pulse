import Sidebar from "../components/sidebar.jsx";
import Header from "../components/header.jsx";
import WelcomeCard from "../components/welcomecard.jsx";
import UpcomingEventCard from "../components/upcomingeventcard.jsx";
import GoalPeriodPill from "../components/GoalPeriodPill.jsx";
import "../styles/immediatesupervisordashboard.css";

// Temporary dashboard data until Supabase / Google Calendar are connected.
const supervisorDashboardData = {
  upcomingSubmission: { title: "Upcoming Submission", date: "02 October 2026", time: "10:00 a.m." },
  upcomingMeeting: { title: "Upcoming Meeting", date: "02 October 2026", time: "10:00 a.m." },
  // Visual-only for now — Weekly/Monthly/Yearly functionality handled separately.
  goalPeriods: [
    { key: "weekly", label: "Weekly Goal", progress: 40 },
    { key: "monthly", label: "Monthly Goal", progress: 70 },
    { key: "yearly", label: "Yearly Goal", progress: 90 },
  ],
};

function ImmediateSupervisorDashboard({ onNavigate }) {
  const handleGoalPeriodClick = (key) => {
    if (onNavigate) onNavigate(key);
  };

  return (
    <div className="supervisor-dashboard-layout">
      <Sidebar role="supervisor" activeItem="dashboard" onNavigate={onNavigate} />

      <div className="supervisor-dashboard-main">
        <Header />

        <WelcomeCard />

        <div className="supervisor-dashboard-events-row">
          <UpcomingEventCard {...supervisorDashboardData.upcomingSubmission} />
          <UpcomingEventCard {...supervisorDashboardData.upcomingMeeting} />
        </div>

        <div className="supervisor-dashboard-goal-period-row">
          {supervisorDashboardData.goalPeriods.map((period) => (
            <GoalPeriodPill
              key={period.key}
              label={period.label}
              progress={period.progress}
              onClick={() => handleGoalPeriodClick(period.key)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default ImmediateSupervisorDashboard;