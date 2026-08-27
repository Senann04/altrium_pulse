import { useState } from "react";
import GlobeAnimation from "../components/globeanimation";
import logo from "../assets/altriumlogo.svg";
import "../styles/login.css";

function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await onLogin({ username, password, rememberMe });
    } catch (error) {
      window.alert(error.message || "Unable to log in.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-left">
        <div className="logo-row">
          <img src={logo} alt="Altrium" className="logo-image" />
          <span className="logo-text">altrium</span>
        </div>

        <GlobeAnimation />
      </div>

      <div className="login-right">
        <div className="login-panel">
          <div className="welcome-banner">
            <h1>Welcome Back!</h1>
          </div>

          <form className="login-form" onSubmit={handleSubmit}>
            <div className="form-card">
              <label htmlFor="username">User Name</label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                required
              />

              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />

              <div className="form-row">
                <label className="remember-me">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  Remember me
                </label>
                <a
                  href="#"
                  className="forgot-password"
                  onClick={(event) => {
                    event.preventDefault();
                    window.alert("Please contact HR to reset your password.");
                  }}
                >
                  Forgot password
                </a>
              </div>
            </div>

            <button type="submit" className="login-button" disabled={loading}>
              {loading ? "Logging In..." : "Log In"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Login;
