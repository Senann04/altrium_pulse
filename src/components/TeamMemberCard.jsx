import "../styles/teammembercard.css";

function TeamMemberCard({ member }) {
  return (
    <div className="team-member-card">
      {member.avatarUrl ? (
        <img src={member.avatarUrl} alt={member.name} className="team-member-avatar" />
      ) : (
        <div className="team-member-avatar" />
      )}
      <div className="team-member-name">{member.name}</div>
      <div className="team-member-id">{member.id}</div>
    </div>
  );
}

export default TeamMemberCard;
