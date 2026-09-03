import Sidebar from "../components/sidebar.jsx";
import Header from "../components/header.jsx";
import DashboardOverview from "../components/DashboardOverview.jsx";
import "../styles/appshell.css";

function ImmediateSupervisorDashboard({ onNavigate, onSignOut, profileData }) {
  return (
    <div className="app-shell">
      <Sidebar role="supervisor" activeItem="dashboard" onNavigate={onNavigate} onSignOut={onSignOut} profileData={profileData} />
      <main className="app-main">
        <Header profileData={profileData} />
        <DashboardOverview role="supervisor" profileData={profileData} onNavigate={onNavigate} />
      </main>
    </div>
  );
}

export default ImmediateSupervisorDashboard;
