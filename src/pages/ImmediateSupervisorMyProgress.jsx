import { useState } from "react";
import Sidebar from "../components/sidebar.jsx";
import Header from "../components/header.jsx";
import AssignedGoalRow from "../components/AssignedGoalRow.jsx";
import EmployeeDevelopmentGoals from "../components/EmployeeDevelopmentGoals.jsx";
import GoalEvidenceSubmission from "../components/GoalEvidenceSubmission.jsx";
import WorkspaceHeading from "../components/WorkspaceHeading";
import { submitGoalEvidence } from "../services/goalEvidenceService.js";
import { respondToPlanAgreement, updateDevelopmentActionStatus } from "../services/performanceWorkflowService.js";
import "../styles/immediatesupervisormyprogress.css";

function SupervisorMyProgress({ onNavigate, onSignOut, profileData }) {
  const [selectedGoal, setSelectedGoal] = useState(null);
  const timeGoals = profileData?.goals || [];
  const plans = profileData?.developmentPlans || [];
  const weekly = timeGoals.filter((goal) => goal.period === "Weekly");
  const monthly = timeGoals.filter((goal) => goal.period === "Monthly");
  const yearly = timeGoals.filter((goal) => goal.period === "Yearly");
  const pdpGoals = plans.filter((goal) => goal.type === "PDP");
  const pipGoals = plans.filter((goal) => goal.type === "PIP");

  const handleEvidenceSubmitted = async (goalId, files) => {
    await submitGoalEvidence({
      planId: goalId,
      actionId: files.actionId,
      actionItemFile: files.actionItemFile,
      evidenceFile: files.evidenceFile,
    });
  };

  const handleAgreement = async (goalId, decision) => {
    const saved = await respondToPlanAgreement(goalId, decision);
    setSelectedGoal((goal) => goal?.id === goalId ? {
      ...goal,
      employeeAgreementStatus: saved.employee_agreement_status,
      supervisorAgreementStatus: saved.supervisor_agreement_status,
    } : goal);
  };

  const handleActionStatus = async (actionId, status) => {
    const saved = await updateDevelopmentActionStatus(actionId, status);
    setSelectedGoal((goal) => {
      if (!goal) return goal;
      const actions = goal.actions.map((action) => action.id === actionId ? { ...action, status: saved.status, completedAt: saved.completed_at } : action);
      const completed = actions.filter((action) => action.status === "completed").length;
      return { ...goal, actions, progress: actions.length ? Math.round((completed / actions.length) * 100) : 0 };
    });
  };

  return (
    <div className="supervisor-progress-layout">
      <Sidebar role="supervisor" activeItem="progress" onNavigate={onNavigate} profileData={profileData} onSignOut={onSignOut} />

      <div className="supervisor-progress-main">
        <Header title="My Progress" profileData={profileData} />

        <WorkspaceHeading
          eyebrow="Goals and delivery"
          title="My Progress"
          description="Keep weekly commitments and longer-term priorities visible in one place."
        />

        <div className="supervisor-progress-columns">
          <div className="supervisor-progress-column">
            <div className="supervisor-progress-column-title">Weekly</div>
            {!weekly.length && <p className="supervisor-progress-empty">No weekly goals assigned.</p>}
            {weekly.map((g) => <AssignedGoalRow key={g.id} goal={g} />)}
          </div>

          <div className="supervisor-progress-column">
            <div className="supervisor-progress-column-title">Monthly</div>
            {!monthly.length && <p className="supervisor-progress-empty">No monthly goals assigned.</p>}
            {monthly.map((g) => <AssignedGoalRow key={g.id} goal={g} />)}
          </div>

          <div className="supervisor-progress-column">
            <div className="supervisor-progress-column-title">Yearly</div>
            {!yearly.length && <p className="supervisor-progress-empty">No yearly goals assigned.</p>}
            {yearly.map((g) => <AssignedGoalRow key={g.id} goal={g} />)}
          </div>
        </div>

        <EmployeeDevelopmentGoals title="PDP Goals" goals={pdpGoals} onSelectGoal={setSelectedGoal} />
        <EmployeeDevelopmentGoals title="PIP Goals" goals={pipGoals} onSelectGoal={setSelectedGoal} />
      </div>

      <GoalEvidenceSubmission
        goal={selectedGoal}
        onClose={() => setSelectedGoal(null)}
        onSubmitEvidence={handleEvidenceSubmitted}
        onAgreement={handleAgreement}
        onActionStatus={handleActionStatus}
      />
    </div>
  );
}

export default SupervisorMyProgress;
