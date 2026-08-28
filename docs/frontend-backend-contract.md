# Frontend-to-backend contract

This branch deliberately leaves every component, page, asset, and stylesheet from
`frontend-development` unchanged. The frontend should keep its current markup and CSS and replace
only temporary data/storage handlers with these APIs.

## Application shell

- Restore the Supabase auth/session shell from `main` without changing any page markup.
- Map database roles to page roles: `employee`, `supervisor`, `hr_partner` -> `hrbp`, and
  `senior_management` -> `leadership`.
- Keep one active page key in the shell (or use a router) and pass its navigation callback to every
  page's existing `onNavigate` prop.

## Review cycles and goals

Use `src/services/workflowService.js`:

- `loadPeopleDirectory()` replaces hardcoded employee/person directories.
- `loadAssignedDevelopmentPlans()`, `createDevelopmentPlan()`,
  `updateDevelopmentPlan()`, and `completeDevelopmentPlan()` replace PDP/PIP prototype arrays.
- `loadTimeGoals()` and `createTimeGoal()` replace `localStorage` time goals.
- `loadReviewCycles()`, `createReviewCycle()`, and `deleteReviewCycle()` replace saved review-cycle
  arrays.
- `loadParMeeting()` and `saveParMeeting()` replace PAR meeting `localStorage`.

All create/update/delete calls are asynchronous. Await them, show an error state, then refresh from
Supabase. Do not show a success state before the promise resolves.

## Current review and self-assessment

Use `src/services/reviewService.js`:

- `loadCurrentReview({ role })` replaces hardcoded current-review data.
- Pass the returned review ID and assessment answers into `saveSelfAssessment()`.
- Use `submit: false` for a draft and `submit: true` for final submission.
- Supervisor and HR flows use `saveSupervisorReview()` and `completeHrReview()`.

## Evidence files

Use `src/services/goalEvidenceService.js`:

- Pass both selected `File` objects to `submitGoalEvidence()`.
- Await the upload before showing success or closing the modal.
- `listGoalEvidence()` and `createGoalEvidenceDownloadUrl()` provide authorized access.
- Uploading evidence does not automatically complete a goal. Refresh the plan and apply the agreed
  approval/progress rule separately.

The first Action Item `SUBMIT` button currently has no click handler, and the PDP/PIP label expression
always returns `PDP`; those are frontend logic fixes and do not require layout or CSS changes.
