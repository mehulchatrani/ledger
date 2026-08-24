import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Divider,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

export default function Login({ onLogin }) {
  const [registering, setRegistering] = useState(false);
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const googleButton = useRef(null);

  useEffect(() => {
    const handleGoogleResponse = async (response) => {
      try {
        await onLogin({ googleCredential: response.credential });
      } catch (err) {
        setError(err.message);
      }
    };

    const renderGoogleButton = () => {
      if (
        !window.google ||
        !googleButton.current ||
        !import.meta.env.VITE_GOOGLE_CLIENT_ID
      )
        return;
      window.google.accounts.id.initialize({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        callback: handleGoogleResponse,
      });
      window.google.accounts.id.renderButton(googleButton.current, {
        theme: "outline",
        size: "large",
        width: 320,
        text: "continue_with",
      });
    };

    if (window.google) renderGoogleButton();
    else {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = renderGoogleButton;
      document.head.appendChild(script);
      return () => script.remove();
    }
  }, [onLogin]);

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();
    setError("");
    try {
      await onLogin({ name, username, password, registering });
    } catch (err) {
      setError(err.message);
    }
  };

  const toggleMode = () => {
    setRegistering(!registering);
    setError("");
  };

  return (
    <main className="login-shell">
      <Paper component="section" className="login-card" elevation={0}>
        <Stack spacing={3}>
          <Box>
            <p className="eyebrow">Private ledger</p>
            <Typography
              variant="h1"
              sx={{ fontSize: "2.2rem", lineHeight: 1.1 }}
            >
              {registering ? "Create your account" : "Welcome back"}
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 1 }}>
              {registering
                ? "Register to access the private ledger."
                : "Sign in to access your records."}
            </Typography>
          </Box>
          {error && <Alert severity="error">{error}</Alert>}
          <Box ref={googleButton} className="google-button" />
          {!import.meta.env.VITE_GOOGLE_CLIENT_ID && (
            <Typography variant="body2" color="text.secondary">
              Google login is not configured yet.
            </Typography>
          )}
          <Divider>or</Divider>
          <Stack component="form" onSubmit={handlePasswordSubmit} spacing={2}>
            {registering && (
              <TextField
                label="Name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                autoComplete="name"
                required
                fullWidth
              />
            )}
            <TextField
              label="Username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              autoComplete="username"
              required
              fullWidth
            />
            <TextField
              label="Password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete={registering ? "new-password" : "current-password"}
              helperText={registering ? "Use at least 8 characters" : undefined}
              required
              fullWidth
            />
            <Button type="submit" variant="contained" size="large">
              {registering ? "Register" : "Sign in"}
            </Button>
          </Stack>
          <Button variant="text" onClick={toggleMode}>
            {registering
              ? "Already have an account? Sign in"
              : "Need an account? Register"}
          </Button>
        </Stack>
      </Paper>
    </main>
  );
}
