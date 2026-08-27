import logo from "../assets/altriumlogo.svg";
import "../styles/shared.css";

const roleMenus = {
  employee: ["Dashboard", "My Reviews", "Goals", "Development Plan", "Profile"],
  supervisor: ["Dashboard", "Team Reviews", "Peer Feedback", "Development Plans", "Profile"],
  hrbp: ["Dashboard", "Review Cycles", "Employees", "Development Plans", "Profile"],
  leadership: ["Dashboard", "Organisation", "Review Insights", "Development Plans", "Profile"],
};

function Sidebar({ role = "employee", activeItem = "profile", onNavigate }) {
  const items = roleMenus[role] || roleMenus.employee;

  return (
    <aside className="pulse-sidebar">
      <div className="pulse-sidebar-brand">
        <img src={logo} alt="" />
        <span>altrium</span>
      </div>

      <nav aria-label="Primary navigation">
        {items.map((item) => {
          const key = item.toLowerCase();
          const isActive = key === activeItem;
          return (
            <button
              key={item}
              type="button"
              className={isActive ? "active" : ""}
              disabled={!isActive}
              onClick={() => onNavigate?.(key)}
            >
              <span aria-hidden="true">{isActive ? "●" : "○"}</span>
              {item}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}

export default Sidebar;
