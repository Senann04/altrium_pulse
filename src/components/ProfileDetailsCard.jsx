function ProfileField({ label, value }) {
  return (
    <div className="employee-profile-field">
      <label>{label}</label>
      <div className="employee-profile-value">{value || "Not assigned"}</div>
    </div>
  );
}

function ProfileDetailsCard({ profileData, showSupervisor = false, showHrPartner = false, teamLabel = "Team", teamValue }) {
  const displayedTeam = teamValue || profileData.department;
  return (
    <div className="employee-profile-card">
      <div className="employee-profile-left">
        <div className="employee-profile-photo" />
        <div className="employee-profile-pill">{profileData.identifier || "Account ID pending"}</div>
        <div className="employee-profile-pill">{displayedTeam || "Unassigned team"}</div>
        <div className="employee-profile-par-cycle">{profileData.parCycle || "No active review cycle"}</div>
      </div>

      <div className="employee-profile-right">
        <ProfileField label="Name" value={profileData.name} />
        <ProfileField label="Work email" value={profileData.workEmail} />
        <ProfileField label="Job title" value={profileData.jobTitle} />
        <ProfileField label={teamLabel} value={displayedTeam} />
        {showSupervisor && <ProfileField label="Immediate supervisor" value={profileData.immediateSupervisor} />}
        {showHrPartner && <ProfileField label="HR business partner" value={profileData.hrBusinessPartner} />}
        <ProfileField label="Current review cycle" value={profileData.parCycle} />
      </div>
    </div>
  );
}

export default ProfileDetailsCard;
