import { useCallback, useEffect, useState } from "react";
import EmployeeProfile from "./pages/EmployeeProfile";
import HRBPProfile from "./pages/HRBPProfile";
import ImmediateSupervisorProfile from "./pages/ImmediateSupervisorProfile";
import LeadershipProfile from "./pages/LeadershipProfile";
import Login from "./pages/Login";
import { isSupabaseConfigured, supabase } from "./lib/supabase";
import { loadProfileView } from "./services/profileAdapter";

const profilePages = {
  employee: EmployeeProfile,
  supervisor: ImmediateSupervisorProfile,
  hr_partner: HRBPProfile,
  senior_management: LeadershipProfile,
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
        "Supabase is not configured. Add the project URL and publishable key to .env.local.",
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
    if (signOutError) setError(signOutError.message);
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

  const ProfilePage = profilePages[profileView.role];

  if (!ProfilePage) {
    return <StatusScreen message="This account has an unsupported role." onSignOut={handleSignOut} />;
  }

  return <ProfilePage profileData={profileView.data} onSignOut={handleSignOut} />;
}

export default App;
