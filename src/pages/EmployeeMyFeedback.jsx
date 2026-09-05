import Sidebar from "../components/sidebar.jsx";
import Header from "../components/header.jsx";
import SelfAssessmentForm from "../components/SelfAssessmentForm";
import EmployeePeerReview from "../components/EmployeePeerReview";
import FeedbackSummary from "../components/feedbacksummary.jsx";
import WorkspaceHeading from "../components/WorkspaceHeading";
import "../styles/employeemyfeedback.css";

function EmployeeMyFeedback({ onNavigate, onSignOut, profileData }) {
  const feedback = profileData?.feedback || {};
  const currentReview = profileData?.currentReview;

  return (
    <div className="employee-feedback-layout">
      <Sidebar role="employee" activeItem="feedback" onNavigate={onNavigate} profileData={profileData} onSignOut={onSignOut} />

      <div className="employee-feedback-main">
        <Header title="My Feedback" profileData={profileData} />

        <WorkspaceHeading
          eyebrow="Feedback workspace"
          title="My Feedback"
          description="Complete your assessments and review the feedback shared with you."
        />

        <div className="employee-feedback-subheading">Provide Feedback</div>

        <div className="employee-feedback-provide-row">
          <SelfAssessmentForm
            reviewId={currentReview?.id}
            initialAnswers={currentReview?.selfAssessment}
            submittedAt={currentReview?.employeeSubmittedAt}
          />
          <EmployeePeerReview />
        </div>

        <div className="employee-feedback-subheading">Feedback for Me</div>

        <FeedbackSummary
          overallRating={feedback.overallRating}
          categoryRatings={feedback.categoryRatings}
        />

        <div className="employee-feedback-bottom-row">
          <div className="employee-feedback-well-done-card">
            <div className="employee-feedback-bottom-title">Strengths</div>
            <div className="employee-feedback-bottom-content">{feedback.strengths || "No strengths have been shared yet."}</div>
          </div>

          <div className="employee-feedback-improve-card">
            <div className="employee-feedback-bottom-title">Development opportunities</div>
            <div className="employee-feedback-bottom-content">{feedback.improvements || "No development feedback has been shared yet."}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EmployeeMyFeedback;
