import Sidebar from "./sidebar.jsx";
import Header from "./header.jsx";
import "../styles/EmployeeProfile.css";

const ROLE_LABELS = {
  employee: "Employee",
  supervisor: "Immediate Supervisor",
  hrbp: "HR Business Partner",
  leadership: "Senior Management",
};

const EMPTY_PROFILE = {
  identifier: "",
  department: "Department",
  parCycle: "Current performance cycle",
  name: "",
  nic: "",
  contactNo: "",
  personalEmail: "",
  address: "",
  immediateSupervisor: "",
  hrBusinessPartner: "",
  jobTitle: "",
};

function ProfileWorkspace({ role, onNavigate, onSignOut, profileData = EMPTY_PROFILE }) {
  const roleLabel = ROLE_LABELS[role] || "Team member";
  const name = profileData.name || roleLabel;
  const initial = name.trim().charAt(0).toUpperCase() || "A";
  const fields = [
    ["Full name", name],
    ["Employee ID", profileData.identifier],
    ["Department", profileData.department],
    ["Job title", profileData.jobTitle || roleLabel],
    ["Email", profileData.personalEmail],
    ["Contact number", profileData.contactNo],
    ["NIC", profileData.nic],
    ["Address", profileData.address],
    ["Immediate supervisor", profileData.immediateSupervisor],
    ["HR business partner", profileData.hrBusinessPartner],
  ];

  return (
    <div className="employee-profile-layout">
      <Sidebar
        role={role}
        activeItem="profile"
        onNavigate={onNavigate}
        profileData={profileData}
        onSignOut={onSignOut}
      />

      <main className="employee-profile-main">
        <Header title="My Profile" profileData={profileData} />

        <div className="employee-profile-page-heading-card">
          <div>
            <span>Account</span>
            <h1>My Profile</h1>
            <p>{profileData.identifier || "Employee record"} · {profileData.department || "Department"}</p>
          </div>
          <button type="button" className="employee-profile-signout-button" onClick={onSignOut}>
            Sign out
          </button>
        </div>

        <section className="employee-profile-card">
          <div className="employee-profile-left">
            <div className="employee-profile-photo" aria-hidden="true">{initial}</div>
            <div className="employee-profile-identity">
              <span>Profile information</span>
              <h2>{name}</h2>
              <p>{profileData.jobTitle || roleLabel}</p>
            </div>
            <div className="employee-profile-status"><i aria-hidden="true" /> Active</div>
          </div>

          <div className="employee-profile-meta">
            <div><span>Role</span><strong>{roleLabel}</strong></div>
            <div><span>Department</span><strong>{profileData.department || "—"}</strong></div>
            <div><span>Review cycle</span><strong>{profileData.parCycle || "—"}</strong></div>
          </div>

          <div className="employee-profile-section-heading">
            <div><span>Employee record</span><h2>Personal and reporting details</h2></div>
            <small>Information is managed by HR</small>
          </div>

          <div className="employee-profile-right">
            {fields.map(([label, value]) => (
              <div className="employee-profile-field" key={label}>
                <label>{label}</label>
                <div className="employee-profile-value">{value || "Not provided"}</div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

export default ProfileWorkspace;
