require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");
const db = require("./db");

const app = express();
const PORT = process.env.PORT || 4000;
const JWT_SECRET =
  process.env.JWT_SECRET || "local-development-secret-change-me";
const googleClient = process.env.GOOGLE_CLIENT_ID
  ? new OAuth2Client(process.env.GOOGLE_CLIENT_ID)
  : null;

app.use(
  cors({ origin: process.env.FRONTEND_ORIGIN || "http://localhost:5173" }),
);
app.use(express.json());

function createToken(user) {
  return jwt.sign(user, JWT_SECRET, { expiresIn: "8h" });
}

function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Authentication required" });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired session" });
  }
}

async function findOrCreateConfiguredUser() {
  const existing = await db.all(
    "SELECT id, name FROM users WHERE username = ?",
    [process.env.AUTH_USERNAME],
  );
  if (existing[0]) return existing[0];
  const result = await db.run(
    "INSERT INTO users (name, username, password_hash, created_at) VALUES (?, ?, ?, ?)",
    [
      "Admin",
      process.env.AUTH_USERNAME,
      process.env.AUTH_PASSWORD_HASH,
      new Date().toISOString(),
    ],
  );
  return { id: result.id, name: "Admin" };
}

app.post("/api/auth/password", async (req, res) => {
  const { username, password } = req.body;
  const configuredAccount =
    username === process.env.AUTH_USERNAME && process.env.AUTH_PASSWORD_HASH
      ? await bcrypt.compare(password || "", process.env.AUTH_PASSWORD_HASH)
      : false;
  const users = await db.all("SELECT * FROM users WHERE username = ?", [
    username,
  ]);
  const registeredAccount =
    users[0] && users[0].password_hash
      ? await bcrypt.compare(password || "", users[0].password_hash)
      : false;
  if (!configuredAccount && !registeredAccount)
    return res.status(401).json({ error: "Invalid username or password" });
  const user = users[0] || (await findOrCreateConfiguredUser());
  if (configuredAccount)
    await db.run("UPDATE records SET user_id = ? WHERE user_id IS NULL", [
      user.id,
    ]);
  res.json({
    token: createToken({
      id: user.id,
      username,
      name: user.name,
      provider: "password",
    }),
  });
});

app.post("/api/auth/register", async (req, res) => {
  const { name, username, password } = req.body;
  if (!name?.trim() || !username?.trim() || !password || password.length < 8) {
    return res
      .status(400)
      .json({
        error:
          "Name, username, and a password of at least 8 characters are required",
      });
  }
  if (username === process.env.AUTH_USERNAME)
    return res.status(409).json({ error: "That username is already in use" });
  try {
    const passwordHash = await bcrypt.hash(password, 12);
    await db.run(
      "INSERT INTO users (name, username, password_hash, created_at) VALUES (?, ?, ?, ?)",
      [name.trim(), username.trim(), passwordHash, new Date().toISOString()],
    );
    const user = await db.all("SELECT id FROM users WHERE username = ?", [
      username.trim(),
    ]);
    res
      .status(201)
      .json({
        token: createToken({
          id: user[0].id,
          username: username.trim(),
          name: name.trim(),
          provider: "password",
        }),
      });
  } catch (err) {
    if (err.message.includes("UNIQUE constraint failed"))
      return res.status(409).json({ error: "That username is already in use" });
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/auth/google", async (req, res) => {
  if (!googleClient || !process.env.GOOGLE_ALLOWED_EMAIL)
    return res.status(503).json({ error: "Google login is not configured" });
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: req.body.googleCredential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if (
      payload.email !== process.env.GOOGLE_ALLOWED_EMAIL ||
      !payload.email_verified
    ) {
      return res
        .status(401)
        .json({ error: "This Google account is not authorized" });
    }
    const existing = await db.all(
      "SELECT * FROM users WHERE google_sub = ? OR email = ?",
      [payload.sub, payload.email],
    );
    let user = existing[0];
    if (!user) {
      const baseUsername =
        payload.email
          .split("@")[0]
          .replace(/[^a-zA-Z0-9._-]/g, "")
          .slice(0, 24) || "client";
      let username = baseUsername;
      let suffix = 1;
      while (
        (await db.all("SELECT id FROM users WHERE username = ?", [username]))
          .length
      )
        username = `${baseUsername}${suffix++}`;
      const result = await db.run(
        "INSERT INTO users (name, username, email, google_sub, created_at) VALUES (?, ?, ?, ?, ?)",
        [
          payload.name || username,
          username,
          payload.email,
          payload.sub,
          new Date().toISOString(),
        ],
      );
      user = { id: result.id };
    }
    res.json({
      token: createToken({
        id: user.id,
        email: payload.email,
        name: payload.name,
        provider: "google",
      }),
    });
  } catch {
    res.status(401).json({ error: "Google sign-in could not be verified" });
  }
});

app.get("/api/records", requireAuth, async (req, res) => {
  try {
    const rows = await db.all(
      "SELECT * FROM records WHERE user_id = ? ORDER BY id DESC",
      [req.user.id],
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/records", requireAuth, async (req, res) => {
  try {
    const { type, amount, quantity, quantityUnit, description, date } =
      req.body;
    const isOtherExpense = type === "other_expenses";
    const calculatedTotal = isOtherExpense ? amount : amount * quantity;
    const result = await db.run(
      "INSERT INTO records (type, amount, quantity, quantity_unit, total, description, date, user_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [
        type,
        amount,
        isOtherExpense ? null : quantity,
        isOtherExpense ? null : quantityUnit,
        calculatedTotal,
        description || "",
        date || new Date().toISOString(),
        req.user.id,
      ],
    );
    const inserted = await db.all(
      "SELECT * FROM records WHERE id = ? AND user_id = ?",
      [result.id, req.user.id],
    );
    res.status(201).json(inserted[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/records/:id", requireAuth, async (req, res) => {
  try {
    const id = req.params.id;
    const { type, amount, quantity, quantityUnit, description, date } =
      req.body;
    const isOtherExpense = type === "other_expenses";
    const calculatedTotal = isOtherExpense ? amount : amount * quantity;
    await db.run(
      "UPDATE records SET type = ?, amount = ?, quantity = ?, quantity_unit = ?, total = ?, description = ?, date = ? WHERE id = ? AND user_id = ?",
      [
        type,
        amount,
        isOtherExpense ? null : quantity,
        isOtherExpense ? null : quantityUnit,
        calculatedTotal,
        description || "",
        date || new Date().toISOString(),
        id,
        req.user.id,
      ],
    );
    const updated = await db.all(
      "SELECT * FROM records WHERE id = ? AND user_id = ?",
      [id, req.user.id],
    );
    if (!updated[0]) return res.status(404).json({ error: "Record not found" });
    res.json(updated[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/records/:id", requireAuth, async (req, res) => {
  try {
    const id = req.params.id;
    const result = await db.run(
      "DELETE FROM records WHERE id = ? AND user_id = ?",
      [id, req.user.id],
    );
    if (!result.changes)
      return res.status(404).json({ error: "Record not found" });
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`);
});
