import Sidebar from "../components/sidebar.jsx";
import Header from "../components/header.jsx";
import WelcomeCard from "../components/welcomecard";
import UpcomingEventCard from "../components/upcomingeventcard.jsx";
import "../styles/hrbpdashboard.css";

// Temporary dashboard data until Supabase / Google Calendar are connected.
const hrbpDashboardData = {
  upcomingMeeting: { title: "Upcoming Meeting", date: "02 October 2026", time: "10:00 a.m." },
};

function HRBPDashboard({ onNavigate }) {
  return (
    <div className="hrbp-dashboard-layout">
      <Sidebar role="hrbp" activeItem="dashboard" onNavigate={onNavigate} />

      <div className="hrbp-dashboard-main">
        <Header />

        <div className="hrbp-dashboard-top-row">
          <div className="hrbp-dashboard-welcome-col">
            <WelcomeCard />
          </div>
          <div className="hrbp-dashboard-meeting-col">
            <UpcomingEventCard {...hrbpDashboardData.upcomingMeeting} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default HRBPDashboard;