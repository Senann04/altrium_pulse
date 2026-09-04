import { useState } from "react";
import DarkVeil from "../components/DarkVeil";
import SpotlightCard from "../components/SpotlightCard";
import logo from "../assets/altriumlogo.svg";
import altriumLogo from "../assets/altrium-logo-white.svg";
import "../styles/login.css";

function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setErrorMessage("");

    try {
      await onLogin({ username, password, rememberMe });
    } catch (error) {
      setErrorMessage(error.message || "We couldn't sign you in. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-page">
      <div className="login-darkveil" aria-hidden="true">
        <DarkVeil
          hueShift={18}
          noiseIntensity={0.018}
          scanlineIntensity={0}
          speed={0.16}
          warpAmount={0.12}
          resolutionScale={1}
        />
      </div>

      <div className="login-intro" aria-hidden="true">
        <div className="login-intro-parent">
          <img src={altriumLogo} alt="" className="login-intro-parent-logo" />
          <p>goes <strong>further.</strong></p>
        </div>
        <div className="login-intro-product">
          <img src={logo} alt="" className="login-intro-logo" />
          <span>People performance, in motion.</span>
        </div>
        <span className="login-intro-line" />
      </div>

      <section className="login-stage" aria-label="Altrium Pulse sign in">
        <header className="login-brand">
          <img src={logo} alt="Altrium Pulse" className="login-logo" />
          <span className="login-secure-status">
            <span aria-hidden="true" />
            Secure workspace
          </span>
        </header>

        <SpotlightCard className="login-card" spotlightColor="rgba(252, 180, 0, 0.1)">
          <div className="login-card-accent" aria-hidden="true" />
          <div className="login-panel-heading">
            <span className="login-panel-kicker">Account access</span>
            <h1>Welcome back</h1>
            <p>Sign in with your company account.</p>
          </div>

          <form className="login-form" onSubmit={handleSubmit}>
            <div className="login-field">
              <label htmlFor="username">Work email</label>
              <div className="login-input-wrap">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M4 6h16v12H4z" />
                  <path d="m4 7 8 6 8-6" />
                </svg>
                <input
                  id="username"
                  type="email"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  autoComplete="username"
                  placeholder="name@company.com"
                  required
                />
              </div>
            </div>

            <div className="login-field">
              <div className="login-label-row">
                <label htmlFor="password">Password</label>
                <button
                  type="button"
                  className="login-text-button"
                  onClick={() => window.alert("Please contact HR to reset your password.")}
                >
                  Forgot password?
                </button>
              </div>
              <div className="login-input-wrap">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <rect x="5" y="10" width="14" height="10" rx="2" />
                  <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                </svg>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  className="login-password-toggle"
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <label className="remember-me">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(event) => setRememberMe(event.target.checked)}
              />
              <span>Keep me signed in</span>
            </label>

            {errorMessage && (
              <div className="login-error" role="alert">
                <span aria-hidden="true">!</span>
                {errorMessage}
              </div>
            )}

            <button type="submit" className="login-button" disabled={loading}>
              <span>{loading ? "Signing in…" : "Sign in"}</span>
              {!loading && (
                <svg viewBox="0 0 20 20" aria-hidden="true">
                  <path d="M4 10h12M11 5l5 5-5 5" />
                </svg>
              )}
            </button>
          </form>

          <p className="login-help">Need access? Contact your HR Business Partner.</p>
        </SpotlightCard>

        <footer className="login-footer">
          <span>People performance workspace</span>
          <span aria-hidden="true" />
          <span>Altrium</span>
        </footer>
      </section>
    </main>
  );
}

export default Login;
