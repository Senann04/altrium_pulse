import "../styles/shared.css";

function Header() {
  return (
    <header className="pulse-header">
      <div>
        <strong>Altrium Pulse</strong>
        <span>Performance Review System</span>
      </div>
      <span className="pulse-header-status">Connected</span>
    </header>
  );
}

export default Header;
