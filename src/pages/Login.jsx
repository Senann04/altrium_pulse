import { useState } from "react";
import logo from "../assets/altriumlogo.svg";
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
      <div className="login-grid" aria-hidden="true" />

      <div className="login-shell">
        <header className="login-brandbar">
          <img src={logo} alt="Altrium Pulse" className="login-logo" />
          <span><i aria-hidden="true" /> Secure workspace</span>
        </header>

        <div className="login-layout">
          <section className="login-story" aria-label="Altrium Pulse overview">
            <span className="login-eyebrow">People performance platform</span>
            <h1>One place for better performance conversations.</h1>
            <p>
              Manage goals, reviews and feedback through a focused workspace built
              for every role in your organisation.
            </p>

            <div className="login-feature-list">
              <div>
                <span>01</span>
                <p><strong>Clear review cycles</strong><small>Know what is due and what comes next.</small></p>
              </div>
              <div>
                <span>02</span>
                <p><strong>Aligned development goals</strong><small>Keep PDP and PIP progress visible.</small></p>
              </div>
              <div>
                <span>03</span>
                <p><strong>Role-based access</strong><small>Only the right people see each workspace.</small></p>
              </div>
            </div>
          </section>

          <section className="login-access">
            <div className="login-panel">
              <p className="login-panel-kicker">Account access</p>
              <h2>Welcome back</h2>
              <p className="login-panel-copy">Sign in with your company account to continue.</p>

              <form className="login-form" onSubmit={handleSubmit}>
                <div className="login-field">
                  <label htmlFor="username">Work email</label>
                  <div className="login-input-wrap">
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M4 6h16v12H4z" /><path d="m4 7 8 6 8-6" />
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
                  <span>Keep me signed in on this device</span>
                </label>

                {errorMessage && (
                  <div className="login-error" role="alert">
                    <span aria-hidden="true">!</span>
                    {errorMessage}
                  </div>
                )}

                <button type="submit" className="login-button" disabled={loading}>
                  <span>{loading ? "Signing in…" : "Sign in"}</span>
                  {!loading && <span aria-hidden="true">→</span>}
                </button>
              </form>

              <p className="login-help">Need access? Contact your HR Business Partner.</p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

export default Login;
