import React, { useEffect, useState } from "react";
import { Button, CssBaseline, ThemeProvider, createTheme } from "@mui/material";
import {
  fetchRecords,
  addRecord,
  updateRecord,
  deleteRecord,
  loginWithGoogle,
  loginWithPassword,
  registerWithPassword,
} from "./api";
import Login from "./components/Login";
import RecordForm from "./components/RecordForm";
import RecordList from "./components/RecordList";
import ProfitLoss from "./components/ProfitLoss";

const theme = createTheme({
  palette: {
    primary: { main: "#155e75" },
    secondary: { main: "#d97706" },
    background: { default: "#f4f7f8", paper: "#ffffff" },
  },
  typography: {
    fontFamily: '"DM Sans", "Segoe UI", sans-serif',
    h1: {
      fontFamily: '"Space Grotesk", "Segoe UI", sans-serif',
      fontWeight: 700,
    },
    h2: {
      fontFamily: '"Space Grotesk", "Segoe UI", sans-serif',
      fontWeight: 700,
    },
  },
  shape: { borderRadius: 10 },
  components: {
    MuiButton: { defaultProps: { disableElevation: true } },
    MuiPaper: { styleOverrides: { root: { border: "1px solid #dce5e8" } } },
  },
});
export default function App() {
  const [records, setRecords] = useState([]);
  const [editing, setEditing] = useState(null);
  const [token, setToken] = useState(() =>
    localStorage.getItem("ledger_token"),
  );
  const [page, setPage] = useState("ledger");

  const load = async () => {
    const data = await fetchRecords();
    setRecords(data);
  };

  useEffect(() => {
    if (token) load();
  }, [token]);

  const handleLogin = async (credentials) => {
    const result = credentials.googleCredential
      ? await loginWithGoogle(credentials.googleCredential)
      : credentials.registering
        ? await registerWithPassword(
            credentials.name,
            credentials.username,
            credentials.password,
          )
        : await loginWithPassword(credentials.username, credentials.password);
    localStorage.setItem("ledger_token", result.token);
    setToken(result.token);
  };

  const handleLogout = () => {
    localStorage.removeItem("ledger_token");
    setToken(null);
    setRecords([]);
    setEditing(null);
  };

  const handleAdd = async (rec) => {
    await addRecord(rec);
    load();
  };

  const handleUpdate = async (id, rec) => {
    await updateRecord(id, rec);
    setEditing(null);
    load();
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this record?")) return;
    await deleteRecord(id);
    load();
  };

  if (!token)
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Login onLogin={handleLogin} />
      </ThemeProvider>
    );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <main className="app-shell">
        <header className="page-header">
          <div>
            <p className="eyebrow">Ledger</p>
            <h1>Purchase / Sell Entry</h1>
            <p className="subtitle">
              Keep every movement and cost in one clear record.
            </p>
          </div>
          <div className="header-actions">
            <Button
              size="small"
              variant={page === "ledger" ? "contained" : "outlined"}
              onClick={() => setPage("ledger")}
            >
              Ledger
            </Button>
            <Button
              size="small"
              variant={page === "profit-loss" ? "contained" : "outlined"}
              onClick={() => setPage("profit-loss")}
            >
              P/L
            </Button>
            <button className="logout-button" onClick={handleLogout}>
              Sign out
            </button>
          </div>
        </header>
        {page === "ledger" ? (
          <>
            <RecordForm
              onSubmit={handleAdd}
              editing={editing}
              onUpdate={handleUpdate}
            />
            <RecordList
              records={records}
              onEdit={setEditing}
              onDelete={handleDelete}
            />
          </>
        ) : (
          <ProfitLoss records={records} />
        )}
      </main>
    </ThemeProvider>
  );
}
