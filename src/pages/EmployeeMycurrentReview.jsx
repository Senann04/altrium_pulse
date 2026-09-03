import Sidebar from "../components/sidebar.jsx";
import Header from "../components/header.jsx";
import ReviewProgressFlow from "../components/ReviewProgressFlow.jsx";
import "../styles/employeemycurrentreview.css";
import PARMeeting from "../components/PARMeeting";
import WorkspaceHeading from "../components/WorkspaceHeading";

// Temporary current-review data until Supabase provides the employee's
// active Review Cycle (created by HR) and real stage statuses.
const currentReviewData = {
  reviewCycle: {
    id: "cycle-1",
    name: "August 2026 Review",
    status: "Finalizing...",
  },
  immediateSupervisor: "R. Thiwen Sandul",
  hrBusinessPartner: "R. Thiwen Sandul",
  // Temporary review-stage display data until stage states are provided by Supabase.
  stages: [
    { key: "self-assessment", label: "Self Assessment", status: "In progress" },
    { key: "peer-review", label: "Peer Review", status: "In progress" },
    { key: "supervisor-review", label: "Supervisor Review", status: "Pending" },
    { key: "normalization", label: "Normalization", status: "Pending" },
    { key: "par-meeting", label: "PAR Meeting", status: "Pending" },
    { key: "pdp-pip", label: "PDP & PIP", status: "Pending" },
  ],
};

// onNavigate is passed down from Sidebar's parent so clicking other menu
// items can switch pages later once real routing exists.
function EmployeeMyCurrentReview({ onNavigate, onSignOut, profileData }) {
  return (
    <div className="employee-current-review-layout">
      <Sidebar role="employee" activeItem="current-review" onNavigate={onNavigate} profileData={profileData} onSignOut={onSignOut} />

      <div className="employee-current-review-main">
        <Header title="My Current Review" profileData={profileData} />

        <WorkspaceHeading
          eyebrow="Performance review"
          title="My Current Review"
          description="See each review stage, the people supporting you and your next scheduled conversation."
          meta={currentReviewData.reviewCycle.name}
        />

        <div className="employee-current-review-progress-card">
          <h2 className="employee-current-review-progress-title">Review Progress</h2>

          <div className="employee-current-review-people-row">
            <span>
              Immediate Supervisor : <strong>{currentReviewData.immediateSupervisor}</strong>
            </span>
            <span>
              HR Business Partner : <strong>{currentReviewData.hrBusinessPartner}</strong>
            </span>
          </div>

          <ReviewProgressFlow
            stages={currentReviewData.stages}
            centerStatus={currentReviewData.reviewCycle.status}
          />
        </div>

        <PARMeeting role="employee" />
      </div>
    </div>
  );
}

export default EmployeeMyCurrentReview;
