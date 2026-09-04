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
      <div className="team-member-progress" aria-label={`${member.goalsCompleted} of ${member.goalsTotal} goals completed`}>
        <span>Goals completed</span>
        <strong>{member.goalsCompleted}/{member.goalsTotal}</strong>
      </div>
    </div>
  );
}

export default TeamMemberCard;
