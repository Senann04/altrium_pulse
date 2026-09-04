import Sidebar from "../components/sidebar.jsx";
import Header from "../components/header.jsx";
import SelfAssessmentForm from "../components/SelfAssessmentForm";
import EmployeePeerReview from "../components/EmployeePeerReview";
import EmployeeHRManagementReview from "../components/EmployeeHRManagementReview";
import FeedbackSummary from "../components/feedbacksummary.jsx";
import WorkspaceHeading from "../components/WorkspaceHeading";
import "../styles/immediatesupervisormyfeedback.css";

function SupervisorMyFeedback({ onNavigate, onSignOut, profileData }) {
  const feedback = profileData?.feedback || {};
  const currentReview = profileData?.currentReview;

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

        <div className="supervisor-feedback-row">
          <SelfAssessmentForm
            reviewId={currentReview?.id}
            initialAnswers={currentReview?.selfAssessment}
            submittedAt={currentReview?.employeeSubmittedAt}
          />
          <EmployeePeerReview peerOptions={profileData?.teammates || []} />
        </div>

        <div className="supervisor-feedback-row">
          <EmployeeHRManagementReview reviewTargets={profileData?.reviewTargets || []} />
        </div>

        <div className="supervisor-feedback-subheading">Feedback for Me</div>

        <FeedbackSummary
          overallRating={feedback.overallRating}
          categoryRatings={feedback.categoryRatings}
        />

        <div className="supervisor-feedback-bottom-row">
          <div className="supervisor-feedback-well-done-card">
            <div className="supervisor-feedback-bottom-title">Strengths</div>
            <div className="supervisor-feedback-bottom-content">{feedback.strengths || "No strengths have been shared yet."}</div>
          </div>

          <div className="supervisor-feedback-improve-card">
            <div className="supervisor-feedback-bottom-title">Development opportunities</div>
            <div className="supervisor-feedback-bottom-content">{feedback.improvements || "No development feedback has been shared yet."}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SupervisorMyFeedback;
