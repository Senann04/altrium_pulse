import "../styles/EmployeeProfile.css";
import Sidebar from "../components/sidebar.jsx";
import Header from "../components/header.jsx";
import woman2 from "../assets/woman2.jpg";

// Temporary profile values until the user profile is loaded from Supabase.
const profileData = {
  identifier: "HRB1842@abcd.lk",
  department: "Department",
  parCycle: "Current PAR Cycle",
  name: "",
  nic: "",
  contactNo: "",
  personalEmail: "",
  address: "",
};

// onSignOut is passed in by the parent — this page has no knowledge of
// how sign-out actually works (no auth system exists yet). Later this
// will call Supabase Auth's signOut() from wherever the real handler lives.
function HRBPProfile({ onSignOut }) {
  const handleSignOut = () => {
    if (onSignOut) onSignOut();
  };

  return (
    <div className="employee-profile-layout">
      <Sidebar role="hrbp" activeItem="profile" onNavigate={() => {}} />

      <div className="employee-profile-main">
        <Header />

        <div className="employee-profile-page-heading-card">My Profile</div>

        <div className="employee-profile-card">
          <div className="employee-profile-left">
            {/* PROFILE PICTURE: place your image file at
                src/assets/employee-profile-photo.jpg and it will render
                here automatically. No placeholder is rendered until that
                file exists. */}
            <img
              src={woman2}
              alt={profileData.name}
              className="employee-profile-photo"
            />

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

export default HRBPProfile;