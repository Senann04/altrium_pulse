import "../styles/sidebar.css";
import altriumLogo from "../assets/altriumlogo.svg";

/* Menu configuration: one entry per role. Add/remove items here only.
Icons are small inline SVGs so no new icon library is required. */

const ICONS = {
  dashboard: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
    </svg>
  ),
  review: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2 L15 9 L22 9.5 L17 14.5 L18.5 21.5 L12 18 L5.5 21.5 L7 14.5 L2 9.5 L9 9 Z" />
    </svg>
  ),
  feedback: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  ),
  projects: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  ),
  progress: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  ),
  team: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  history: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9" /><polyline points="12 7 12 12 15 15" />
    </svg>
  ),
  calendar: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
  profile: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
    </svg>
  ),
  goals: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1" />
    </svg>
  ),
  cycle: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" />
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </svg>
  ),
};

// Role -> menu items. Each item needs a unique key, a label, and an icon.
const MENUS = {
  employee: [
    { key: "dashboard", label: "Dashboard", icon: "dashboard" },
    { key: "current-review", label: "My Current Review", icon: "review" },
    { key: "feedback", label: "My Feedback", icon: "feedback" },
    { key: "progress", label: "My Progress", icon: "progress" },
    { key: "profile", label: "My Profile", icon: "profile" },
  ],
  supervisor: [
    { key: "dashboard", label: "Dashboard", icon: "dashboard" },
    { key: "current-review", label: "My Current Review", icon: "review" },
    { key: "feedback", label: "My Feedback", icon: "feedback" },
    { key: "progress", label: "My Progress", icon: "progress" },
    { key: "team", label: "My Team", icon: "team" },
    { key: "profile", label: "My Profile", icon: "profile" },
  ],
  leadership: [
    { key: "dashboard", label: "Dashboard", icon: "dashboard" },
    { key: "profile", label: "My Profile", icon: "profile" },
  ],
  hrbp: [
    { key: "dashboard", label: "Dashboard", icon: "dashboard" },
    { key: "review-cycle", label: "Review Cycle", icon: "cycle" },
    { key: "assign-goals", label: "Assign Goals", icon: "goals" },
    { key: "profile", label: "My Profile", icon: "profile" },
  ],
};

const ROLE_LABELS = {
  employee: "Employee",
  supervisor: "Supervisor",
  hrbp: "HR Business Partner",
  leadership: "Senior Management",
};


/*Sidebar component

 activeItem -> key of the currently active menu item (visual only)
 onNavigate -> callback fired with the clicked item's key; routing is
              wired up later, this component does not navigate itself */

function Sidebar({ role, activeItem, onNavigate }) {
  const menuItems = MENUS[role] || [];

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <img src={altriumLogo} alt="Altrium Pulse" />
        <span>Performance workspace</span>
      </div>

      <div className="sidebar-role">
        <span className="sidebar-role-dot" aria-hidden="true" />
        <div>
          <small>Signed in as</small>
          <strong>{ROLE_LABELS[role] || "Team member"}</strong>
        </div>
      </div>

      <nav className="sidebar-menu" aria-label="Workspace navigation">
        {menuItems.map((item) => {
          const isActive = item.key === activeItem;
          return (
            <button
              key={item.key}
              type="button"
              className={`sidebar-item${isActive ? " active" : ""}`}
              onClick={() => onNavigate && onNavigate(item.key)}
            >
              <span className="sidebar-icon">{ICONS[item.icon]}</span>
              <span className="sidebar-label">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <span className="sidebar-footer-mark">AP</span>
        <p><strong>Altrium Pulse</strong><span>People performance platform</span></p>
      </div>
    </aside>
  );
}

export default Sidebar;
