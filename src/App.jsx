import LeadershipProfile from "./pages/LeadershipProfile";

function App() {
  return <LeadershipProfile onSignOut={() => alert("Sign out clicked")} />;
}

export default App;