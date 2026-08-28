import "../styles/upcomingeventcard.css";

/*Reusable for Upcoming Meeting, Upcoming Submission, and any future
 event/deadline card — title/date/time are passed in as props.*/
function UpcomingEventCard({ title, date, time }) {
  return (
    <div className="upcoming-event-card">
      <span className="upcoming-event-title">{title}</span>
      <span className="upcoming-event-date">{date}</span>
      <span className="upcoming-event-time">{time}</span>
    </div>
  );
}

export default UpcomingEventCard;