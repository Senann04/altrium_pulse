import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import "../styles/cycle-hr-allocation.css";

function PoolEditor({ person, teams, projects, busy, locked, onSave }) {
  const [draft, setDraft] = useState(person);
  const toggle = (key, id) => setDraft((value) => ({ ...value, [key]: value[key].includes(id) ? value[key].filter((item) => item !== id) : [...value[key], id] }));
  return <fieldset className="allocation-pool" disabled={busy || locked}>
    <legend>{person.name} <small>{person.assigned} assigned</small></legend>
    <div className="allocation-pool-controls">
      <label><input type="checkbox" checked={draft.available} onChange={(e) => setDraft({ ...draft, available: e.target.checked })} /> Available this cycle</label>
      <label>Maximum reviews<input type="number" min="1" max="10000" value={draft.capacity} onChange={(e) => setDraft({ ...draft, capacity: e.target.value })} /></label>
    </div>
    <span className="allocation-label">Eligible teams</span>
    <div className="allocation-options">{teams.map((team) => <label key={team.id}><input type="checkbox" checked={draft.department_ids.includes(team.id)} onChange={() => toggle("department_ids", team.id)} />{team.name}</label>)}</div>
    {!!projects.length && <><span className="allocation-label">Eligible projects</span><div className="allocation-options">{projects.map((project) => <label key={project.id}><input type="checkbox" checked={draft.project_ids.includes(project.id)} onChange={() => toggle("project_ids", project.id)} />{project.name}</label>)}</div></>}
    {!locked && <button type="button" disabled={!Number.isInteger(Number(draft.capacity)) || Number(draft.capacity) < 1 || Number(draft.capacity) > 10000} onClick={() => onSave("pool", { ...draft, capacity: Number(draft.capacity) })}>Save rules</button>}
  </fieldset>;
}

export default function CycleHRAllocation({ cycle }) {
  const [allowed, setAllowed] = useState(false);
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [search, setSearch] = useState("");
  const locked = cycle.status !== "Draft";
  const load = useCallback(async () => {
    setError("");
    const permission = await supabase.from("hr_assignment_administrators").select("user_id").limit(1);
    if (permission.error) { setError(permission.error.message); return; }
    const access = Boolean(permission.data?.length);
    setAllowed(access);
    if (!access) return;
    const result = await supabase.rpc("get_cycle_allocation", { p_cycle_id: cycle.id });
    if (result.error) setError(result.error.message);
    else { setData(result.data); setConfirmed(false); }
  }, [cycle.id]);
  useEffect(() => { const timer = setTimeout(load, 0); return () => clearTimeout(timer); }, [load]);
  const act = async (action, payload = {}) => {
    setBusy(true); setError(""); setNotice("");
    try {
      const result = await supabase.rpc("update_cycle_allocation", { p_cycle_id: cycle.id, p_revision: data.revision, p_action: action, p_payload: payload });
      if (result.error) throw result.error;
      setData(result.data); setConfirmed(false);
      setNotice(action === "approve" ? "Assignments approved. This cycle can now be started." : action === "pool" ? "Rules saved. Generate a new proposal to apply them." : "Proposal updated. Changes require approval.");
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  };
  if (!allowed) return null;
  const unresolved = data?.employees.filter((p) => !p.hr_partner_id || !p.eligible_hr_ids.includes(p.hr_partner_id)).length || 0;
  const overCapacity = data?.pool.some((p) => p.assigned > p.capacity);
  const employees = data?.employees.filter((p) => `${p.employee_name} ${p.employee_number} ${p.department_name}`.toLowerCase().includes(search.toLowerCase())) || [];
  return <section className="cycle-allocation" aria-label={`HRBP allocation for ${cycle.name}`}>
    <div className="allocation-heading"><div><span>Head of HR</span><h3>Cycle HRBP allocation</h3><p>Set eligible teams and capacity. The system balances assignments; you review and approve them before the cycle starts.</p></div><strong>{data?.approvedAt ? "Approved" : locked ? "Historical cycle" : "Awaiting approval"}</strong></div>
    {error && <p role="alert" className="hr-admin-inline-error">{error} <button type="button" onClick={load} disabled={busy}>Reload</button></p>}
    {notice && <p role="status">{notice}</p>}
    {!data ? <p>Loading allocation…</p> : <>
      {!locked && <div className="allocation-actions"><button type="button" disabled={busy} onClick={() => act("prepare")}>{data.employees.length ? "Refresh roster and regenerate" : "Prepare automatic proposal"}</button><button type="button" disabled={busy || !data.employees.length} onClick={() => act("generate")}>Regenerate assignments</button></div>}
      {!locked && <p className="allocation-help">Refreshing replaces draft team edits with the current employee directory. Saving rules clears proposals. Any edit invalidates approval.</p>}
      <div className="allocation-pools">{data.pool.map((person) => <PoolEditor key={`${person.hr_partner_id}-${data.revision}`} person={person} teams={data.teams} projects={data.projects} busy={busy} locked={locked} onSave={act} />)}</div>
      {!!data.employees.length && <>
        <div className="allocation-summary"><strong>{data.employees.length} employees</strong><span>{unresolved} unresolved</span><span>{overCapacity ? "Capacity exceeded" : "Within capacity"}</span></div>
        <label className="allocation-search">Find an employee<input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Name, ID or team" /></label>
        <div className="allocation-table-wrap"><table><thead><tr><th>Employee</th><th>Team this cycle</th><th>Assigned HRBP</th><th>Allocation reason</th></tr></thead><tbody>{employees.map((employee) => <tr key={employee.employee_id}>
          <td><strong>{employee.employee_name}</strong><small>{employee.employee_number}</small></td>
          <td><select aria-label={`Team for ${employee.employee_name}`} value={employee.department_id || ""} disabled={busy || locked} onChange={(e) => act("employee", { employee_id: employee.employee_id, department_id: e.target.value, hr_partner_id: null })}><option value="">No team</option>{data.teams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}</select></td>
          <td><select aria-label={`HRBP for ${employee.employee_name}`} value={employee.hr_partner_id || ""} disabled={busy || locked} onChange={(e) => act("employee", { employee_id: employee.employee_id, department_id: employee.department_id, hr_partner_id: e.target.value })}><option value="">Unresolved</option>{data.pool.filter((p) => employee.eligible_hr_ids.includes(p.hr_partner_id) || employee.hr_partner_id === p.hr_partner_id).map((p) => <option key={p.hr_partner_id} value={p.hr_partner_id}>{p.name}</option>)}</select></td>
          <td>{employee.reason}</td>
        </tr>)}</tbody></table></div>
        {!locked && !data.approvedAt && <div className="allocation-approval"><label><input type="checkbox" checked={confirmed} disabled={busy} onChange={(e) => setConfirmed(e.target.checked)} /> I reviewed the cycle teams, HRBP assignments and workload.</label><button type="button" disabled={busy || unresolved > 0 || overCapacity || !confirmed} onClick={() => act("approve")}>{busy ? "Saving…" : "Approve assignments"}</button></div>}
        {data.approvedAt && <p className="allocation-help">Approved {new Date(data.approvedAt).toLocaleString()}. Assignments are locked when the cycle starts.</p>}
      </>}
      {locked && !data.employees.length && <p>This cycle predates allocation proposals. Its existing review owners are preserved.</p>}
    </>}
  </section>;
}
