import Sidebar from "../components/sidebar.jsx";
import Header from "../components/header.jsx";
import ReviewProgressFlow from "../components/ReviewProgressFlow";
import "../styles/immediatesupervisormycurrentreview.css";
import PARMeeting from "../components/PARMeeting";
import WorkspaceHeading from "../components/WorkspaceHeading";

function ImmediateSupervisorMyCurrentReview({ onNavigate, onSignOut, profileData }) {
  const currentReview = profileData?.currentReview;

  return (
    <div className="supervisor-current-review-layout">
      <Sidebar role="supervisor" activeItem="current-review" onNavigate={onNavigate} profileData={profileData} onSignOut={onSignOut} />

      <div className="supervisor-current-review-main">
        <Header title="My Current Review" profileData={profileData} />

        <WorkspaceHeading
          eyebrow="Performance review"
          title="My Current Review"
          description="Follow your own review stages and schedule the conversation that closes the cycle."
          meta={currentReview?.cycleName || profileData?.parCycle || "No active review"}
        />

        <div className="supervisor-current-review-progress-card">
          <h2 className="supervisor-current-review-progress-title">Review Progress</h2>

          <div className="supervisor-current-review-people-row">
            <span>
              HR Business Partner :{" "}
              <strong>{profileData?.hrBusinessPartner || "Not assigned"}</strong>
            </span>
          </div>

          {currentReview ? (
            <ReviewProgressFlow
              stages={currentReview.stages}
              centerStatus={currentReview.status}
            />
          ) : (
            <div className="supervisor-current-review-empty">
              <strong>No personal review assigned</strong>
              <span>Your review progress will appear here once HR assigns you to an active cycle.</span>
            </div>
          )}
        </div>

        <PARMeeting role="supervisor" meeting={profileData?.meeting} reviewId={currentReview?.id} />
      </div>
    </div>
  );
}

export default ImmediateSupervisorMyCurrentReview;
