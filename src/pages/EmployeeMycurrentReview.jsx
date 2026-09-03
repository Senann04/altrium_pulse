import Sidebar from "../components/sidebar.jsx";
import Header from "../components/header.jsx";
import ReviewProgressFlow from "../components/ReviewProgressFlow.jsx";
import "../styles/employeemycurrentreview.css";
import PARMeeting from "../components/PARMeeting";

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
        <Header title="Current Review" profileData={profileData} />

        <div className="employee-current-review-heading-card">
          <div><span>Reviews</span><h1>My Current Review</h1><p>Follow each stage of your active performance review.</p></div>
          <div className="employee-current-review-cycle-pill">
            {currentReviewData.reviewCycle.name}
          </div>
        </div>

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
