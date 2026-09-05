import Sidebar from "../components/sidebar.jsx";
import Header from "../components/header.jsx";
import ReviewCycleSection from "../components/ReviewCycleSection";
import HRReviewOperations from "../components/HRReviewOperations";
import WorkspaceHeading from "../components/WorkspaceHeading";
import "../styles/hrreviewcycle.css";

function HRReviewCycle({ onNavigate, onSignOut, profileData }) {
  return (
    <div className="hr-review-cycle-layout">
      <Sidebar role="hrbp" activeItem="review-cycle" onNavigate={onNavigate} profileData={profileData} onSignOut={onSignOut} />

      <div className="hr-review-cycle-main">
        <Header title="Review Cycles" profileData={profileData} />
        <WorkspaceHeading
          eyebrow="Performance administration"
          title="Review Cycles"
          description="Monitor company review schedules and administer PAR activity across your assigned teams."
        />
        <ReviewCycleSection canManage={profileData?.canManageReviewCycles} />
        <HRReviewOperations assignedTeams={profileData?.assignedTeams || []} assignedProjects={profileData?.assignedProjects || []} />
      </div>
    </div>
  );
}

export default HRReviewCycle;
