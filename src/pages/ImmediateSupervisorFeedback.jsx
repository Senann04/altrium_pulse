import Sidebar from "../components/sidebar.jsx";
import Header from "../components/header.jsx";
import SelfAssessmentForm from "../components/SelfAssessmentForm";
import EmployeePeerReview from "../components/EmployeePeerReview";
import EmployeeHRManagementReview from "../components/EmployeeHRManagementReview";
import FeedbackSummary from "../components/feedbacksummary.jsx";
import WorkspaceHeading from "../components/WorkspaceHeading";
import "../styles/immediatesupervisormyfeedback.css";

// temporary values until Supabase provides real Feedback records
const supervisorFeedbackData = {
  overallRating: "4.5",
  // category ratings are frontend-only until the backend schema supports them
  categoryRatings: [
    { name: "Communication", value: 87 },
    { name: "Reliability", value: 95 },
    { name: "Professionalism", value: 78 },
  ],
  strengths: "",
  improvements: "",
};

function SupervisorMyFeedback({ onNavigate, onSignOut, profileData }) {
  return (
    <div className="supervisor-feedback-layout">
      <Sidebar role="supervisor" activeItem="feedback" onNavigate={onNavigate} profileData={profileData} onSignOut={onSignOut} />

      <div className="supervisor-feedback-main">
        <Header title="My Feedback" profileData={profileData} />

        <WorkspaceHeading
          eyebrow="Feedback workspace"
          title="My Feedback"
          description="Complete assessments for yourself and others, then review the feedback shared with you."
        />

        <div className="supervisor-feedback-subheading">Provide Feedback</div>

        {/* row 1: Self Assessment + first Peer Review */}
        <div className="supervisor-feedback-row">
          <SelfAssessmentForm />
          <EmployeePeerReview />
        </div>

        {/* row 2: second Peer Review + HR and Management review */}
        <div className="supervisor-feedback-row">
          <EmployeePeerReview />
          <EmployeeHRManagementReview />
        </div>

        <div className="supervisor-feedback-subheading">Feedback for Me</div>

        <FeedbackSummary
          overallRating={supervisorFeedbackData.overallRating}
          categoryRatings={supervisorFeedbackData.categoryRatings}
        />

        <div className="supervisor-feedback-bottom-row">
          <div className="supervisor-feedback-well-done-card">
            <div className="supervisor-feedback-bottom-title">Strengths</div>
            <div className="supervisor-feedback-bottom-content">{supervisorFeedbackData.strengths || "No strengths have been shared yet."}</div>
          </div>

          <div className="supervisor-feedback-improve-card">
            <div className="supervisor-feedback-bottom-title">Development opportunities</div>
            <div className="supervisor-feedback-bottom-content">{supervisorFeedbackData.improvements || "No development feedback has been shared yet."}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SupervisorMyFeedback;
