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
};

function LeadershipProfile({ onNavigate, onSignOut, profileData = emptyProfile }) {
  const handleSignOut = () => {
    if (onSignOut) onSignOut();
  };

  return (
    <div className="employee-profile-layout">
      <Sidebar role="leadership" activeItem="profile" onNavigate={onNavigate} onSignOut={handleSignOut} profileData={profileData} />

      <div className="employee-profile-main">
        <Header title="My Profile" profileData={profileData} />

        <WorkspaceHeading
          eyebrow="Account"
          title="My Profile"
          description="Review your leadership profile and organisational information."
          meta={profileData.identifier || "Leadership record"}
        />

        <ProfileDetailsCard profileData={profileData} />

        <div className="employee-profile-signout-row">
          <button type="button" className="employee-profile-signout-button" onClick={handleSignOut}>
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}

export default LeadershipProfile;
