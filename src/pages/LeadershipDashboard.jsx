import Sidebar from "../components/sidebar.jsx";
import Header from "../components/header.jsx";
import DashboardOverview from "../components/DashboardOverview.jsx";
import "../styles/appshell.css";

function LeadershipDashboard({ onNavigate, onSignOut, profileData }) {
  return (
    <div className="app-shell">
      <Sidebar role="leadership" activeItem="dashboard" onNavigate={onNavigate} profileData={profileData} onSignOut={onSignOut} />
      <main className="app-main">
        <Header title="Overview" profileData={profileData} />
        <DashboardOverview role="leadership" profileData={profileData} onNavigate={onNavigate} />
      </main>
    </div>
  );
}

export default LeadershipDashboard;
