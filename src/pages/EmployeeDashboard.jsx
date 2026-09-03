import Sidebar from "../components/sidebar.jsx";
import Header from "../components/header.jsx";
import DashboardOverview from "../components/DashboardOverview.jsx";
import "../styles/appshell.css";

function EmployeeDashboard({ onNavigate, onSignOut, profileData }) {
  return (
    <div className="app-shell">
      <Sidebar role="employee" activeItem="dashboard" onNavigate={onNavigate} profileData={profileData} onSignOut={onSignOut} />
      <main className="app-main">
        <Header title="Overview" profileData={profileData} />
        <DashboardOverview role="employee" profileData={profileData} onNavigate={onNavigate} />
      </main>
    </div>
  );
}

export default EmployeeDashboard;
