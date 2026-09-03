import Sidebar from "../components/sidebar.jsx";
import Header from "../components/header.jsx";
import SelfAssessmentForm from "../components/SelfAssessmentForm";
import EmployeePeerReview from "../components/EmployeePeerReview";
import FeedbackSummary from "../components/feedbacksummary.jsx";
import WorkspaceHeading from "../components/WorkspaceHeading";
import "../styles/employeemyfeedback.css";

/* Temporary feedback values until Supabase provides real Feedback records.
   Category ratings are frontend-only until the backend schema supports them. */
const employeeFeedbackData = {
  overallRating: "4.5",
  categoryRatings: [
    { name: "Team Work", value: 98 },
    { name: "Communication", value: 95 },
    { name: "Reliability", value: 77 },
    { name: "Professionalism", value: 78 },
    { name: "Technical Contribution", value: 53 },
  ],
  // maps to the existing Feedback.strengths / Feedback.improvements fields
  strengths: "",
  improvements: "",
};

function EmployeeMyFeedback({ onNavigate, onSignOut, profileData }) {
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
          <SelfAssessmentForm />
          <EmployeePeerReview />
        </div>

        <div className="employee-feedback-subheading">Feedback for Me</div>

        <FeedbackSummary
          overallRating={employeeFeedbackData.overallRating}
          categoryRatings={employeeFeedbackData.categoryRatings}
        />

        <div className="employee-feedback-bottom-row">
          <div className="employee-feedback-well-done-card">
            <div className="employee-feedback-bottom-title">Strengths</div>
            <div className="employee-feedback-bottom-content">{employeeFeedbackData.strengths || "No strengths have been shared yet."}</div>
          </div>

          <div className="employee-feedback-improve-card">
            <div className="employee-feedback-bottom-title">Development opportunities</div>
            <div className="employee-feedback-bottom-content">{employeeFeedbackData.improvements || "No development feedback has been shared yet."}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EmployeeMyFeedback;
