import { createTimeGoal, loadTimeGoals } from "./workflowService";

let assignedTimeGoals = [];
const listeners = new Set();

function notify() {
  listeners.forEach((listener) => listener());
}

export function getAssignedTimeGoals() {
  return assignedTimeGoals;
}

export async function refreshAssignedTimeGoals() {
  assignedTimeGoals = await loadTimeGoals();
  notify();
  return assignedTimeGoals;
}

export async function addAssignedTimeGoal(goal) {
  const saved = await createTimeGoal(goal);
  assignedTimeGoals = [saved, ...assignedTimeGoals];
  notify();
  return saved;
}

export function subscribeToAssignedTimeGoals(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
