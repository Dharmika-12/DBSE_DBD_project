const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
 
const pool = require("../config/db");
 
const router = express.Router();
 
/* =========================
   COLLECTOR SIGNUP
========================= */
 
router.post("/signup", async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;
 
    if (!name || !email || !phone || !password) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }
 
    const [existing] = await pool.execute(
      "SELECT id FROM users WHERE email = ?",
      [email]
    );
 
    if (existing.length > 0) {
      return res.status(400).json({
        message: "Email already registered",
      });
    }
 
    const hashedPassword = await bcrypt.hash(password, 10);
 
    const [result] = await pool.execute(
      `INSERT INTO users
        (name, email, phone, password, role)
        VALUES (?, ?, ?, ?, 'COLLECTOR')`,
      [name, email, phone, hashedPassword]
    );
 
    res.status(201).json({
      message: "Collector signup successful",
      userId: result.insertId,
    });
  } catch (error) {
    // -------------------------------------------------
    // Full detail goes to YOUR terminal so you can see
    // the real SQL/DB error. The client only ever gets
    // a generic message.
    // -------------------------------------------------
    console.error("SIGNUP ERROR:", error.code, "-", error.sqlMessage || error.message);
 
    res.status(500).json({
      message: "Server error",
    });
  }
});
 
/* =========================
   LOGIN
========================= */
 
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
 
    const [users] = await pool.execute(
      "SELECT * FROM users WHERE email = ?",
      [email]
    );
 
    if (users.length === 0) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }
 
    const user = users[0];
 
    const validPassword = await bcrypt.compare(password, user.password);
 
    if (!validPassword) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }
 
    /* ONLY COLLECTORS */
 
    if (user.role !== "COLLECTOR") {
      return res.status(403).json({
        message: "Only blood collectors can login.",
      });
    }
 
    const token = jwt.sign(
      {
        id: user.id,
        role: user.role,
        name: user.name,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );
 
    res.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("LOGIN ERROR:", error.code, "-", error.sqlMessage || error.message);
 
    res.status(500).json({
      message: "Server error",
    });
  }
});
 
module.exports = router;