import "../styles/EmployeeProfile.css";
import Sidebar from "../components/sidebar.jsx";
import Header from "../components/header.jsx";

const emptyProfile = {
  identifier: "",
  department: "Department",
  parCycle: "Current PAR Cycle",
  name: "",
  nic: "",
  contactNo: "",
  personalEmail: "",
  address: "",
  immediateSupervisor: "",
  hrBusinessPartner: "",
};

function EmployeeProfile({ onSignOut, profileData = emptyProfile }) {
  const handleSignOut = () => {
    if (onSignOut) onSignOut();
  };

  return (
    <div className="employee-profile-layout">
      <Sidebar role="employee" activeItem="profile" onNavigate={onNavigate} />

      <div className="employee-profile-main">
        <Header />

        <div className="employee-profile-page-heading-card">My Profile</div>

        <div className="employee-profile-card">
          <div className="employee-profile-left">
            <div className="employee-profile-photo" />

            <div className="employee-profile-pill">{profileData.identifier}</div>
            <div className="employee-profile-pill">{profileData.department}</div>
            <div className="employee-profile-par-cycle">{profileData.parCycle}</div>
          </div>

          <div className="employee-profile-right">
            <div className="employee-profile-field">
              <label>Name :</label>
              <div className="employee-profile-value">{profileData.name}</div>
            </div>

            <div className="employee-profile-field">
              <label>NIC :</label>
              <div className="employee-profile-value">{profileData.nic}</div>
            </div>

            <div className="employee-profile-field">
              <label>Contact NO :</label>
              <div className="employee-profile-value">{profileData.contactNo}</div>
            </div>

            <div className="employee-profile-field">
              <label>Personal E-Mail :</label>
              <div className="employee-profile-value">{profileData.personalEmail}</div>
            </div>

            <div className="employee-profile-field">
              <label>Address :</label>
              <div className="employee-profile-value employee-profile-address">
                {profileData.address}
              </div>
            </div>

            <div className="employee-profile-field">
              <label>Immediate Supervisor :</label>
              <div className="employee-profile-value">{profileData.immediateSupervisor}</div>
            </div>

            <div className="employee-profile-field">
              <label>HR Business Partner :</label>
              <div className="employee-profile-value">{profileData.hrBusinessPartner}</div>
            </div>
          </div>
        </div>

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
