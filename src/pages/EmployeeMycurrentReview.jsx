import Sidebar from "../components/sidebar.jsx";
import Header from "../components/header.jsx";
import ReviewProgressFlow from "../components/ReviewProgressFlow.jsx";
import "../styles/employeemycurrentreview.css";
import PARMeeting from "../components/PARMeeting";
import WorkspaceHeading from "../components/WorkspaceHeading";

function EmployeeMyCurrentReview({ onNavigate, onSignOut, profileData }) {
  const currentReview = profileData?.currentReview;
  const emptyStages = ["Self Assessment", "Peer Review", "Supervisor Review", "Normalization", "PAR Meeting", "PDP & PIP"]
    .map((label) => ({ key: label.toLowerCase().replace(/\s+|&/g, "-"), label, status: "Pending" }));
  const stages = currentReview?.stages || emptyStages;

  return (
    <div className="employee-current-review-layout">
      <Sidebar role="employee" activeItem="current-review" onNavigate={onNavigate} profileData={profileData} onSignOut={onSignOut} />

      <div className="employee-current-review-main">
        <Header title="My Current Review" profileData={profileData} />

        <WorkspaceHeading
          eyebrow="Performance review"
          title="My Current Review"
          description="See each review stage, the people supporting you and your next scheduled conversation."
          meta={currentReview?.cycleName || profileData?.parCycle || "No active review"}
        />

        <div className="employee-current-review-progress-card">
          <h2 className="employee-current-review-progress-title">Review Progress</h2>

          <div className="employee-current-review-people-row">
            <span>
              Immediate Supervisor : <strong>{profileData?.immediateSupervisor || "Not assigned"}</strong>
            </span>
            <span>
              HR Business Partner : <strong>{profileData?.hrBusinessPartner || "Not assigned"}</strong>
            </span>
          </div>

          <ReviewProgressFlow
            stages={stages}
            centerStatus={currentReview?.status || "Not started"}
          />
        </div>

        <PARMeeting role="employee" meeting={profileData?.meeting} />
      </div>
    </div>
  );
}

export default EmployeeMyCurrentReview;
