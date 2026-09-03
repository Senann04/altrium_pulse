import Sidebar from "../components/sidebar.jsx";
import Header from "../components/header.jsx";
import ReviewProgressFlow from "../components/ReviewProgressFlow";
import "../styles/immediatesupervisormycurrentreview.css";
import PARMeeting from "../components/PARMeeting";
import WorkspaceHeading from "../components/WorkspaceHeading";

/* Temporary supervisor review data until Supabase records are connected. */
const immediateSupervisorCurrentReviewData = {
  reviewCycle: {
    id: "cycle-1",
    name: "August 2026 Review",
    status: "Finalizing...",
  },
  hrBusinessPartner: "R. Thiwen Sandul",
  stages: [
    { key: "self-assessment", label: "Self Assessment", status: "In progress" },
    { key: "peer-review", label: "Peer Review", status: "In progress" },
    { key: "normalization", label: "Normalization", status: "Pending" },
    { key: "par-meeting", label: "PAR Meeting", status: "Pending" },
  ],
};

function ImmediateSupervisorMyCurrentReview({ onNavigate, onSignOut, profileData }) {
  return (
    <div className="supervisor-current-review-layout">
      <Sidebar role="supervisor" activeItem="current-review" onNavigate={onNavigate} profileData={profileData} onSignOut={onSignOut} />

      <div className="supervisor-current-review-main">
        <Header title="My Current Review" profileData={profileData} />

        <WorkspaceHeading
          eyebrow="Performance review"
          title="My Current Review"
          description="Follow your own review stages and schedule the conversation that closes the cycle."
          meta={immediateSupervisorCurrentReviewData.reviewCycle.name}
        />

        <div className="supervisor-current-review-progress-card">
          <h2 className="supervisor-current-review-progress-title">Review Progress</h2>

          <div className="supervisor-current-review-people-row">
            <span>
              HR Business Partner :{" "}
              <strong>{immediateSupervisorCurrentReviewData.hrBusinessPartner}</strong>
            </span>
          </div>

          <ReviewProgressFlow
            stages={immediateSupervisorCurrentReviewData.stages}
            centerStatus={immediateSupervisorCurrentReviewData.reviewCycle.status}
          />
        </div>

        <PARMeeting role="supervisor" />
      </div>
    </div>
  );
}

export default ImmediateSupervisorMyCurrentReview;
