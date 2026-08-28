import "../styles/welcomecard.css";

/*TEMPORARY employee data.
Replace with real profile data (name, employee ID) once the
user/profile system is connected. Currently hardcoded here only
because no parent dashboard page exists yet to pass it down as props.*/

const DUMMY_EMPLOYEE = {
  name: "Tharindu Perera",
  employeeId: "EM1842",
};

/*Reusable across Employee / Supervisor / HRBP / Leadership dashboards.
name/employeeId/statusMessage are props so each dashboard can pass
its own data later without duplicating this component.*/
function WelcomeCard({
  name = DUMMY_EMPLOYEE.name,
  employeeId = DUMMY_EMPLOYEE.employeeId,
  statusMessage = "Your August 2026 performance review is currently in progress",
}) {
  return (
    <div className="welcome-card">
      <div className="welcome-card-text">
        <h1 className="welcome-card-title">WELCOME TO Altrium.Pulse</h1>
        <p className="welcome-card-status">{statusMessage}</p>
      </div>

      <div className="welcome-card-identity">
        <div className="welcome-card-identity-text">
          <span className="welcome-card-name">{name}</span>
          <span className="welcome-card-id">{employeeId}</span>
        </div>
        <div className="welcome-card-avatar-circle" aria-hidden="true" />
      </div>
    </div>
  );
}

export default WelcomeCard;