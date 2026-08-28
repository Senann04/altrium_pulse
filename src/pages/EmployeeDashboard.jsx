import Sidebar from "../components/sidebar.jsx";
import Header from "../components/header.jsx";
import WelcomeCard from "../components/welcomecard";
import UpcomingEventCard from "../components/upcomingeventcard.jsx";
import GoalPeriodPill from "../components/GoalPeriodPill";
import GoalProgressCard from "../components/GoalProgressCard.jsx";
import "../styles/employeedashboard.css";

// Temporary dashboard data until Supabase / Google Calendar are connected.
const employeeDashboardData = {
  upcomingMeeting: { title: "Upcoming Meeting", date: "02 October 2026", time: "10:00 a.m." },
  upcomingSubmission: { title: "Upcoming Submission", date: "02 October 2026", time: "10:00 a.m." },
  // Visual-only for now — Weekly/Monthly/Yearly functionality deferred.
  goalPeriods: [
    { key: "weekly", label: "Weekly Goal", progress: 40 },
    { key: "monthly", label: "Monthly Goal", progress: 70 },
    { key: "yearly", label: "Yearly Goal", progress: 90 },
  ],
  developmentPlans: {
    pdp: {
      action_items: [
        { description: "Complete leadership training module", completed: true },
        { description: "Lead a cross-functional project", completed: true },
        { description: "Mentor a junior team member", completed: true },
        { description: "Present quarterly progress review", completed: false },
        { description: "Complete advanced certification course", completed: false },
      ],
    },
    pip: {
      action_items: [
        { description: "Attend weekly check-in meetings", completed: true },
        { description: "Meet sprint delivery targets", completed: true },
        { description: "Reduce reported defect rate", completed: true },
        { description: "Complete communication skills workshop", completed: true },
        { description: "Improve code review turnaround time", completed: true },
        { description: "Achieve consistent on-time task completion", completed: false },
        { description: "Pass final 90-day performance evaluation", completed: false },
        { description: "Submit self-assessment summary", completed: false },
      ],
    },
  },
};

function EmployeeDashboard({ onNavigate }) {
  // Placeholder until Weekly/Monthly/Yearly goal pages actually exist.
  const handleGoalPeriodClick = (key) => {
    if (onNavigate) onNavigate(key);
  };

  return (
    <div className="employee-dashboard-layout">
      <Sidebar role="employee" activeItem="dashboard" onNavigate={onNavigate} />

      <div className="employee-dashboard-main">
        <Header />

        <div className="employee-dashboard-top-row">
          <div className="employee-dashboard-welcome-col">
            <WelcomeCard />
          </div>
          <div className="employee-dashboard-events-col">
            <UpcomingEventCard {...employeeDashboardData.upcomingMeeting} />
            <UpcomingEventCard {...employeeDashboardData.upcomingSubmission} />
          </div>
        </div>

        <div className="employee-dashboard-goal-period-row">
          {employeeDashboardData.goalPeriods.map((period) => (
            <GoalPeriodPill
              key={period.key}
              label={period.label}
              progress={period.progress}
              onClick={() => handleGoalPeriodClick(period.key)}
            />
          ))}
        </div>

        <GoalProgressCard title="PDP Goal Progress" plan={employeeDashboardData.developmentPlans.pdp} />
        <GoalProgressCard title="PIP Goal Progress" plan={employeeDashboardData.developmentPlans.pip} />
      </div>
    </div>
  );
}

export default EmployeeDashboard;
