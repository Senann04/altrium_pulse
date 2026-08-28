import { useCallback, useEffect, useState } from "react";
import AssignGoals from "./pages/AssignGoals";
import EmployeeDashboard from "./pages/EmployeeDashboard";
import EmployeeMyFeedback from "./pages/EmployeeMyFeedback";
import EmployeeMyProgress from "./pages/EmployeeMyProgress";
import EmployeeMyCurrentReview from "./pages/EmployeeMycurrentReview";
import EmployeeProfile from "./pages/EmployeeProfile";
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
import { isSupabaseConfigured, supabase } from "./lib/supabase";
import { loadProfileView } from "./services/profileAdapter";

const rolePages = {
  employee: {
    dashboard: EmployeeDashboard,
    "current-review": EmployeeMyCurrentReview,
    feedback: EmployeeMyFeedback,
    progress: EmployeeMyProgress,
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
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background: "#111111",
        color: "#ffffff",
        fontFamily: '"Inria Sans", sans-serif',
        padding: "2rem",
        textAlign: "center",
      }}
    >
      <div>
        <p>{message}</p>
        {onSignOut && (
          <button
            type="button"
            onClick={onSignOut}
            style={{
              marginTop: "1rem",
              border: 0,
              borderRadius: "999px",
              padding: "0.65rem 1.4rem",
              background: "#f8b50d",
              color: "#111111",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
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

  const refreshClaims = useCallback(async () => {
    if (!supabase) {
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
    const initialRefresh = window.setTimeout(refreshClaims, 0);
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

  const handleLogin = async ({ username, password }) => {
    if (!supabase) {
      throw new Error(
        "Supabase is not configured. Add the project URL and publishable key to the Vercel environment.",
      );
    }

    const { error: loginError } = await supabase.auth.signInWithPassword({
      email: username.trim(),
      password,
    });

    if (loginError) throw loginError;
  };

  const handleSignOut = async () => {
    if (!supabase) return;
    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) {
      setError(signOutError.message);
      return;
    }
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
