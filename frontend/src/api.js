const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";
const BASE = `${API_URL}/records`;
const AUTH_BASE = `${API_URL}/auth`;

function authHeaders() {
  const token = localStorage.getItem("ledger_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function parseResponse(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

export async function loginWithPassword(username, password) {
  const res = await fetch(`${AUTH_BASE}/password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  return parseResponse(res);
}

export async function registerWithPassword(name, username, password) {
  const res = await fetch(`${AUTH_BASE}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, username, password }),
  });
  return parseResponse(res);
}

export async function loginWithGoogle(googleCredential) {
  const res = await fetch(`${AUTH_BASE}/google`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ googleCredential }),
  });
  return parseResponse(res);
}

export async function fetchRecords() {
  const res = await fetch(BASE, { headers: authHeaders() });
  return parseResponse(res);
}

export async function addRecord(rec) {
  const res = await fetch(BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(rec),
  });
  return parseResponse(res);
}

export async function updateRecord(id, rec) {
  const res = await fetch(`${BASE}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(rec),
  });
  return parseResponse(res);
}

export async function deleteRecord(id) {
  const res = await fetch(`${BASE}/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Request failed");
  return res;
}
