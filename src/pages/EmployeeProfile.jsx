import "../styles/EmployeeProfile.css";
import Sidebar from "../components/sidebar.jsx";
import Header from "../components/header.jsx";
import WorkspaceHeading from "../components/WorkspaceHeading";
import ProfileDetailsCard from "../components/ProfileDetailsCard";

const emptyProfile = {
  identifier: "",
  department: "Department",
  parCycle: "Current PAR Cycle",
  name: "",
  workEmail: "",
  immediateSupervisor: "",
  hrBusinessPartner: "",
};

function EmployeeProfile({ onNavigate, onSignOut, profileData = emptyProfile }) {
  const handleSignOut = () => {
    if (onSignOut) onSignOut();
  };

  return (
    <div className="employee-profile-layout">
      <Sidebar role="employee" activeItem="profile" onNavigate={onNavigate} onSignOut={handleSignOut} profileData={profileData} />

      <div className="employee-profile-main">
        <Header title="My Profile" profileData={profileData} />

        <WorkspaceHeading
          eyebrow="Account"
          title="My Profile"
          description="Review your employee details and current reporting relationships."
          meta={profileData.identifier || "Employee record"}
        />

        <ProfileDetailsCard profileData={profileData} showSupervisor showHrPartner />

        <div className="employee-profile-signout-row">
          <button type="button" className="employee-profile-signout-button" onClick={handleSignOut}>
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}

export default EmployeeProfile;
