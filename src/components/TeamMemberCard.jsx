import "../styles/teammembercard.css";

function TeamMemberCard({ member }) {
  return (
    <div className="team-member-card">
      {member.avatarUrl ? (
        <img src={member.avatarUrl} alt={member.name} className="team-member-avatar" />
      ) : (
        <div className="team-member-avatar" />
      )}
      <div className="team-member-name" />
      <div className="team-member-id" />
    </div>
  );
}

export default TeamMemberCard;