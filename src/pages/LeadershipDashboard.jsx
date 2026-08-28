import Sidebar from "../components/sidebar.jsx";
import Header from "../components/header.jsx";
import WelcomeCard from "../components/welcomecard";
import UpcomingEventCard from "../components/upcomingeventcard.jsx";
import "../styles/leadershipdashboard.css";

// Temporary dashboard data until Supabase / Google Calendar are connected.
const leadershipDashboardData = {
  upcomingMeeting: { title: "Upcoming Meeting", date: "02 October 2026", time: "10:00 a.m." },
};

function LeadershipDashboard({ onNavigate }) {
  return (
    <div className="leadership-dashboard-layout">
      <Sidebar role="leadership" activeItem="dashboard" onNavigate={onNavigate} />

      <div className="leadership-dashboard-main">
        <Header />

        <div className="leadership-dashboard-top-row">
          <div className="leadership-dashboard-welcome-col">
            {/* name/employeeId left blank until real profile data exists —
                overrides WelcomeCard's own "Tharindu Perera" default */}
            <WelcomeCard name="" employeeId="" />
          </div>
          <div className="leadership-dashboard-meeting-col">
            <UpcomingEventCard {...leadershipDashboardData.upcomingMeeting} />
          </div>
        </div>

        {/* Lower placeholder feature intentionally excluded — not yet developed. */}
      </div>
    </div>
  );
}

export default LeadershipDashboard;