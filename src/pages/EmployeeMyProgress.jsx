import { useState } from "react";
import Sidebar from "../components/sidebar.jsx";
import Header from "../components/header.jsx";
import AssignedGoalRow from "../components/AssignedGoalRow.jsx";
import EmployeeDevelopmentGoals from "../components/EmployeeDevelopmentGoals.jsx";
import GoalEvidenceSubmission from "../components/GoalEvidenceSubmission.jsx";
import WorkspaceHeading from "../components/WorkspaceHeading";
import { submitGoalEvidence } from "../services/goalEvidenceService.js";
import { respondToPlanAgreement, updateDevelopmentActionStatus } from "../services/performanceWorkflowService.js";
import "../styles/employeemyprogress.css";

function EmployeeMyProgress({ onNavigate, onSignOut, profileData }) {
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
    <div className="employee-progress-layout">
      <Sidebar role="employee" activeItem="progress" onNavigate={onNavigate} profileData={profileData} onSignOut={onSignOut} />

      <div className="employee-progress-main">
        <Header title="My Progress" profileData={profileData} />

        <WorkspaceHeading
          eyebrow="Goals and development"
          title="My Progress"
          description="Track short-term priorities and keep your development plans moving."
        />

        <div className="employee-progress-time-columns">
          <div className="employee-progress-time-column">
            <div className="employee-progress-time-title">Weekly</div>
            {!weekly.length && <p className="employee-progress-empty">No weekly goals assigned.</p>}
            {weekly.map((goal) => <AssignedGoalRow key={goal.id} goal={goal} />)}
          </div>
          <div className="employee-progress-time-column">
            <div className="employee-progress-time-title">Monthly</div>
            {!monthly.length && <p className="employee-progress-empty">No monthly goals assigned.</p>}
            {monthly.map((goal) => <AssignedGoalRow key={goal.id} goal={goal} />)}
          </div>
          <div className="employee-progress-time-column">
            <div className="employee-progress-time-title">Yearly</div>
            {!yearly.length && <p className="employee-progress-empty">No yearly goals assigned.</p>}
            {yearly.map((goal) => <AssignedGoalRow key={goal.id} goal={goal} />)}
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

export default EmployeeMyProgress;
