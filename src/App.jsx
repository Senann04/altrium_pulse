import { useCallback, useEffect, useState } from "react";
import AssignGoals from "./pages/AssignGoals";
import EmployeeDashboard from "./pages/EmployeeDashboard";
import EmployeeMyFeedback from "./pages/EmployeeMyFeedback";
import EmployeeMyProgress from "./pages/EmployeeMyProgress";
import EmployeeMyCurrentReview from "./pages/EmployeeMycurrentReview";
import EmployeeProfile from "./pages/EmployeeProfile";
import { EmployeeCalendar, EmployeePerformanceHistory, EmployeeProjects } from "./pages/EmployeeWorkspacePages";
import HRBPDashboard from "./pages/HRBPDashboard";
import HRBPProfile from "./pages/HRBPProfile";
import HRReviewCycle from "./pages/HRReviewCycle";
import ImmediateSupervisorDashboard from "./pages/ImmediateSupervisorDashboard";
import ImmediateSupervisorFeedback from "./pages/ImmediateSupervisorFeedback";
import ImmediateSupervisorMyCurrentReview from "./pages/ImmediateSupervisorMyCurrentReview";
import ImmediateSupervisorMyProgress from "./pages/ImmediateSupervisorMyProgress";
import ImmediateSupervisorProfile from "./pages/ImmediateSupervisorProfile";
import LeadershipDashboard from "./pages/LeadershipDashboard";
import LeadershipProfile from "./pages/LeadershipProfile";
import Login from "./pages/Login";
import MyTeam from "./pages/MyTeam";
import logo from "./assets/altriumlogo.svg";
import { isSupabaseConfigured, supabase } from "./lib/supabase";
import { loadProfileView } from "./services/profileAdapter";
import "./styles/statusscreen.css";

const REMEMBER_KEY = "altrium-pulse:remember-me";
const SESSION_KEY = "altrium-pulse:session-active";

const rolePages = {
  employee: {
    dashboard: EmployeeDashboard,
    "current-review": EmployeeMyCurrentReview,
    feedback: EmployeeMyFeedback,
    progress: EmployeeMyProgress,
    projects: EmployeeProjects,
    history: EmployeePerformanceHistory,
    calendar: EmployeeCalendar,
    profile: EmployeeProfile,
  },
  supervisor: {
    dashboard: ImmediateSupervisorDashboard,
    "current-review": ImmediateSupervisorMyCurrentReview,
    feedback: ImmediateSupervisorFeedback,
    progress: ImmediateSupervisorMyProgress,
    team: MyTeam,
    profile: ImmediateSupervisorProfile,
  },
  hr_partner: {
    dashboard: HRBPDashboard,
    "review-cycle": HRReviewCycle,
    "assign-goals": AssignGoals,
    profile: HRBPProfile,
  },
  senior_management: {
    dashboard: LeadershipDashboard,
    profile: LeadershipProfile,
  },
};

function StatusScreen({ message, onSignOut }) {
  const isLoading = !onSignOut;

  return (
    <div className="status-screen">
      <div className={`status-card${isLoading ? " status-card-loading" : " status-card-message"}`}>
        <img src={logo} alt="Altrium Pulse" className="status-logo" />
        <p>{message}</p>
        {isLoading && (
          <div className="status-progress" aria-hidden="true">
            <span />
          </div>
        )}
        {onSignOut && (
          <button type="button" onClick={onSignOut}>
            Sign Out
          </button>
        )}
      </div>
    </div>
  );
}

function App() {
  const [claims, setClaims] = useState(null);
  const [profileView, setProfileView] = useState(null);
  const [activePage, setActivePage] = useState("dashboard");
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [error, setError] = useState("");

  const refreshClaims = useCallback(async ({ enforceRememberPreference = false } = {}) => {
    if (!supabase) {
      setClaims(null);
      setLoading(false);
      return;
    }

    const rememberPreference = window.localStorage.getItem(REMEMBER_KEY);
    const activeTabSession = window.sessionStorage.getItem(SESSION_KEY);
    if (enforceRememberPreference && rememberPreference === "false" && !activeTabSession) {
      await supabase.auth.signOut();
      setClaims(null);
      setLoading(false);
      return;
    }

    const { data, error: claimsError } = await supabase.auth.getClaims();
    setClaims(claimsError ? null : data?.claims ?? null);
    setError(claimsError?.message || "");
    setLoading(false);
  }, []);

  useEffect(() => {
    const initialRefresh = window.setTimeout(
      () => refreshClaims({ enforceRememberPreference: true }),
      0,
    );
    if (!supabase) {
      return () => window.clearTimeout(initialRefresh);
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      window.setTimeout(refreshClaims, 0);
    });

    return () => {
      window.clearTimeout(initialRefresh);
      subscription.unsubscribe();
    };
  }, [refreshClaims]);

  useEffect(() => {
    let mounted = true;

    async function fetchProfile() {
      if (!claims?.sub) {
        setProfileView(null);
        return;
      }

      setLoading(true);
      try {
        const view = await loadProfileView(claims.sub);
        if (mounted) {
          setProfileView(view);
          setActivePage("dashboard");
          setError("");
        }
      } catch (profileError) {
        if (mounted) {
          setProfileView(null);
          setError(profileError.message || "Unable to load this profile.");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchProfile();
    return () => {
      mounted = false;
    };
  }, [claims?.sub]);

  const handleLogin = async ({ username, password, rememberMe }) => {
    if (!supabase) {
      throw new Error(
        "Supabase is not configured. Add the project URL and publishable key to the Vercel environment.",
      );
    }

    window.localStorage.setItem(REMEMBER_KEY, rememberMe ? "true" : "false");
    window.sessionStorage.setItem(SESSION_KEY, "true");

    const { error: loginError } = await supabase.auth.signInWithPassword({
      email: username.trim(),
      password,
    });

    if (loginError) {
      window.sessionStorage.removeItem(SESSION_KEY);
      throw loginError;
    }
  };

  const handleSignOut = async () => {
    if (!supabase) return;
    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) {
      setError(signOutError.message);
      return;
    }
    window.localStorage.removeItem(REMEMBER_KEY);
    window.sessionStorage.removeItem(SESSION_KEY);
    setActivePage("dashboard");
  };

  if (loading) return <StatusScreen message="Loading Altrium Pulse..." />;

  if (!claims) {
    return <Login onLogin={handleLogin} />;
  }

  if (error || !profileView) {
    return (
      <StatusScreen
        message={error || "No profile is linked to this authenticated account."}
        onSignOut={handleSignOut}
      />
    );
  }

  const pages = rolePages[profileView.role];
  if (!pages) {
    return <StatusScreen message="This account has an unsupported role." onSignOut={handleSignOut} />;
  }

  const Page = pages[activePage] || pages.dashboard;
  const handleNavigate = (pageKey) => {
    if (pages[pageKey]) setActivePage(pageKey);
  };

  return (
    <Page
      profileData={profileView.data}
      onNavigate={handleNavigate}
      onSignOut={handleSignOut}
    />
  );
}

export default App;
