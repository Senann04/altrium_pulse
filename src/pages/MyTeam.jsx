import Sidebar from "../components/sidebar.jsx";
import Header from "../components/header.jsx";
import TeamMemberCard from "../components/TeamMemberCard";
import SupervisorReviewOperations from "../components/SupervisorReviewOperations";
import WorkspaceHeading from "../components/WorkspaceHeading";
import "../styles/myteam.css";

function MyTeam({ onNavigate, onSignOut, profileData }) {
  const teamMembers = profileData?.teamMembers || [];

  return (
    <div className="my-team-layout">
      <Sidebar role="supervisor" activeItem="team" onNavigate={onNavigate} profileData={profileData} onSignOut={onSignOut} />

      <div className="my-team-main">
        <Header title="My Team" profileData={profileData} />

        <WorkspaceHeading
          eyebrow="Team workspace"
          title="My Team"
          description="Review the people you support, their current review stage and team-plan progress."
          meta={`${teamMembers.length} team ${teamMembers.length === 1 ? "member" : "members"}`}
        />

        <div className="my-team-list">
          {teamMembers.map((member) => (
            <TeamMemberCard key={member.id} member={member} />
          ))}
          {!teamMembers.length && (
            <div className="my-team-empty">
              <strong>No direct reports assigned</strong>
              <span>Employees assigned to you will appear here automatically.</span>
            </div>
          )}
        </div>

        <SupervisorReviewOperations />
      </div>
    </div>
  );
}

export default MyTeam;
