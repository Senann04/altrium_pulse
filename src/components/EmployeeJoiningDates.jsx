import { useEffect, useState } from "react";
import { loadJoiningDateRoster, saveJoiningDate } from "../services/joiningDateService";
import "../styles/employeejoiningdates.css";

function EmployeeJoiningDates() {
  const [people, setPeople] = useState([]);
  const [drafts, setDrafts] = useState({});
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;
    loadJoiningDateRoster()
      .then((rows) => {
        if (!active) return;
        setPeople(rows);
        setDrafts(Object.fromEntries(rows.map((person) => [person.id, person.joined_on || ""])));
        setMessage("");
      })
      .catch((error) => active && setMessage(error.message || "Unable to load joining dates."))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, []);

  const persist = async (person) => {
    const joinedOn = drafts[person.id];
    if (!joinedOn) {
      setMessage(`Enter a joining date for ${person.full_name}.`);
      return;
    }
    setSavingId(person.id);
    setMessage("");
    try {
      await saveJoiningDate(person.id, joinedOn);
      setPeople((current) => current.map((item) => item.id === person.id ? { ...item, joined_on: joinedOn } : item));
      setMessage(`${person.full_name}'s joining date was saved and cycle eligibility was recalculated.`);
    } catch (error) {
      setMessage(error.message || "Unable to save this joining date.");
    } finally {
      setSavingId("");
    }
  };

  const missingCount = people.filter((person) => !person.joined_on).length;

  return (
    <section className="employee-joining-dates">
      <header>
        <div><span>Cycle eligibility</span><h2>Company joining dates</h2><p>Joining dates determine which approved cycles automatically include each person.</p></div>
        <strong className={missingCount ? "needs-attention" : "complete"}>{missingCount ? `${missingCount} missing` : "All recorded"}</strong>
      </header>

      {loading ? <p className="employee-joining-state">Loading employee records…</p> : (
        <div className="employee-joining-list">
          {people.map((person) => (
            <article key={person.id} className={!person.joined_on ? "missing" : ""}>
              <span className="employee-joining-avatar" aria-hidden="true">{person.full_name.slice(0, 1).toUpperCase()}</span>
              <div className="employee-joining-person"><strong>{person.full_name}</strong><span>{person.employee_number || "ID pending"} · {person.job_title || (person.role === "supervisor" ? "Supervisor" : "Employee")}</span></div>
              <label>Joined company<input type="date" max={new Date().toISOString().slice(0, 10)} value={drafts[person.id] || ""} onChange={(event) => setDrafts((current) => ({ ...current, [person.id]: event.target.value }))} /></label>
              <button type="button" disabled={savingId === person.id || !drafts[person.id] || drafts[person.id] === person.joined_on} onClick={() => persist(person)}>{savingId === person.id ? "Saving…" : "Save date"}</button>
            </article>
          ))}
          {!people.length && <p className="employee-joining-state">No employees or supervisors are assigned to your HR account.</p>}
        </div>
      )}
      <p className="employee-joining-message" role="status">{message}</p>
    </section>
  );
}

export default EmployeeJoiningDates;
