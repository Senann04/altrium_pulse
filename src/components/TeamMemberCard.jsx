import "../styles/teammembercard.css";

function TeamMemberCard({ member }) {
  return (
    <div className="team-member-card">
      {member.avatarUrl ? (
        <img src={member.avatarUrl} alt={member.name} className="team-member-avatar" />
      ) : (
        <div className="team-member-avatar" aria-hidden="true">{member.name?.charAt(0) || "–"}</div>
      )}
      <div className="team-member-identity">
        <strong>{member.name}</strong>
        <span>{member.jobTitle}</span>
      </div>
      <div className="team-member-detail">
        <span>Employee ID</span>
        <strong>{member.employeeNumber}</strong>
      </div>
      <div className="team-member-detail">
        <span>Current review</span>
        <strong>{member.reviewStatus}</strong>
      </div>
      <div
        className="team-member-progress"
        aria-label={`PDP ${member.planProgress?.pdp || 0} percent, PIP ${member.planProgress?.pip || 0} percent`}
      >
        <span>Plan progress</span>
        <div>
          <strong>PDP {member.planProgress?.pdp || 0}%</strong>
          <strong>PIP {member.planProgress?.pip || 0}%</strong>
        </div>
      </div>
    </div>
  );
}

export default TeamMemberCard;
