import Sidebar from "../components/sidebar.jsx";
import Header from "../components/header.jsx";
import ReviewCycleSection from "../components/ReviewCycleSection";
import "../styles/hrreviewcycle.css";

function HRReviewCycle({ onNavigate, onSignOut, profileData }) {
  return (
    <div className="hr-review-cycle-layout">
      <Sidebar role="hrbp" activeItem="review-cycle" onNavigate={onNavigate} profileData={profileData} onSignOut={onSignOut} />

      <div className="hr-review-cycle-main">
        <Header title="Review Cycles" profileData={profileData} />
        <ReviewCycleSection />
      </div>
    </div>
  );
}

export default HRReviewCycle;
