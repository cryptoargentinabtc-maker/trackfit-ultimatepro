const SUPABASE_URL = "https://lxsjsxmvnxpcfdzbrxpt.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx4c2pzeG12bnhwY2ZkemJyeHB0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE3MTExODcsImV4cCI6MjA5NzI4NzE4N30.kgBfVV7v_ZCMWOlzjl9pyzv6CwROTmCAjRMmQO0I6IY";

const headers = {
  "Content-Type": "application/json",
  "apikey": SUPABASE_KEY,
  "Authorization": `Bearer ${SUPABASE_KEY}`,
  "Prefer": "return=minimal",
};

const BASE = SUPABASE_URL.replace("/rest/v1/","");

async function sbGet(table) {
  const r = await fetch(`${BASE}/rest/v1/${table}?select=*`, { headers });
  if (!r.ok) return [];
  return r.json();
}

async function sbUpsert(table, row) {
  await fetch(`${BASE}/rest/v1/${table}`, {
    method: "POST",
    headers: { ...headers, "Prefer": "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify(row),
  });
}

async function sbDelete(table, id) {
  await fetch(`${BASE}/rest/v1/${table}?id=eq.${id}`, {
    method: "DELETE",
    headers,
  });
}

/* ── History ── */
export async function loadHistory() {
  const rows = await sbGet("sessions");
  return rows.map(r => ({
    id: r.id,
    liftKey: r.lift_key,
    liftName: r.lift_name,
    unit: r.unit,
    date: r.date,
    sets: r.sets,
    notes: r.notes || "",
    maxWeight: r.max_weight,
    totalVolume: r.total_volume,
  }));
}

export async function saveSession(entry) {
  await sbUpsert("sessions", {
    id: entry.id,
    lift_key: entry.liftKey,
    lift_name: entry.liftName,
    unit: entry.unit || "kg",
    date: entry.date,
    sets: entry.sets,
    notes: entry.notes || "",
    max_weight: entry.maxWeight,
    total_volume: entry.totalVolume,
  });
}

export async function deleteSession(id) {
  await sbDelete("sessions", id);
}

/* ── Body log ── */
export async function loadBodyLog() {
  const rows = await sbGet("body_log");
  return rows.map(r => ({ id: r.id, date: r.date, weight: r.weight }));
}

export async function saveBodyEntry(entry) {
  await sbUpsert("body_log", { id: entry.id, date: entry.date, weight: entry.weight });
}

export async function deleteBodyEntry(id) {
  await sbDelete("body_log", id);
}

/* ── Supp log ── */
export async function loadSuppLog() {
  const rows = await sbGet("supp_log");
  const log = {};
  rows.forEach(r => { log[r.date] = r.data; });
  return log;
}

export async function saveSuppLog(date, data) {
  await sbUpsert("supp_log", {
    id: `supp_${date}`,
    date,
    data,
  });
}
