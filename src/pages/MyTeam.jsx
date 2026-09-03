import Sidebar from "../components/sidebar.jsx";
import Header from "../components/header.jsx";
import TeamMemberCard from "../components/TeamMemberCard";
import WorkspaceHeading from "../components/WorkspaceHeading";
import "../styles/myteam.css";

/* Temporary team-member values until Supabase profile data is connected.
 avatarUrl stays null until real profile pictures exist — each record
is shaped so the backend can later fill name/employeeId/avatarUrl
straight from a supervisor's assigned team query.*/
const supervisorTeamMembers = [
  { id: "EM00145", name: "S. Supun Kalhara", avatarUrl: null },
  { id: "EM00212", name: "Nadeesha Fernando", avatarUrl: null },
  { id: "EM00300", name: "Amaya Perera", avatarUrl: null },
];

function MyTeam({ onNavigate, onSignOut, profileData }) {
  return (
    <div className="my-team-layout">
      <Sidebar role="supervisor" activeItem="team" onNavigate={onNavigate} profileData={profileData} onSignOut={onSignOut} />

      <div className="my-team-main">
        <Header title="My Team" profileData={profileData} />

        <WorkspaceHeading
          eyebrow="Team workspace"
          title="My Team"
          description="Review the people you support and keep their performance conversations moving."
          meta={`${supervisorTeamMembers.length} team members`}
        />

        <div className="my-team-list">
          {supervisorTeamMembers.map((member) => (
            <TeamMemberCard key={member.id} member={member} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default MyTeam;
