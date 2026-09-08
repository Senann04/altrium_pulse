import Sidebar from "../components/sidebar.jsx";
import Header from "../components/header.jsx";
import WorkspaceHeading from "../components/WorkspaceHeading";
import DashboardOverview from "../components/DashboardOverview.jsx";
import "../styles/appshell.css";

function HRBPDashboard({ onNavigate, onSignOut, profileData }) {
  return (
    <div className="app-shell">
      <Sidebar role="hrbp" activeItem="dashboard" onNavigate={onNavigate} onSignOut={onSignOut} profileData={profileData} />
      <main className="app-main">
        <Header profileData={profileData} />
        {profileData?.canManageHRAssignments ? <section>
          <WorkspaceHeading eyebrow="Head of HR" title="Coordinate cycles and HRBP assignments" description="Manage shared review schedules, review automatic HRBP proposals and approve the allocation for each new cycle." />
          <div className="hr-head-actions"><button type="button" onClick={()=>onNavigate("review-cycle")}>Manage cycles and allocations</button><button type="button" onClick={()=>onNavigate("profile")}>View my profile</button></div>
          <p>Employee records remain limited to your assigned teams and projects. Assignment administration does not grant access to every employee’s private reviews.</p>
        </section> : <DashboardOverview role="hrbp" profileData={profileData} onNavigate={onNavigate} />}
      </main>
    </div>
  );
}

export default HRBPDashboard;
