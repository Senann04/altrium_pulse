import Sidebar from "../components/sidebar.jsx";
import Header from "../components/header.jsx";
import ReviewCycleSection from "../components/ReviewCycleSection";
import "../styles/hrreviewcycle.css";

function HRReviewCycle({ onNavigate }) {
  return (
    <div className="hr-review-cycle-layout">
      <Sidebar role="hrbp" activeItem="review-cycle" onNavigate={onNavigate} />

      <div className="hr-review-cycle-main">
        <Header />
        <ReviewCycleSection />
      </div>
    </div>
  );
}

export default HRReviewCycle;