import { useState } from "react";
import GlobeAnimation from "../components/globeanimation";
import logo from "../assets/altriumlogo.svg"; // Where the actual logo needs to go
import "../styles/login.css";

// TEMPORARY PLACEHOLDER LOGO — replace with:
//   import logo from "../assets/altrium-logo-white.svg";
// and swap the <svg> block below for <img src={logo} alt="Altrium" className="logo-image" />

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Supabase auth wired up later — intentionally not implemented yet.
  };

  return (
    //Altrium logo
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
              />

              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
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
                <a href="#" className="forgot-password">
                  Forgot password
                </a>
              </div>
            </div>

            <button type="submit" className="login-button">
              Log In
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Login;