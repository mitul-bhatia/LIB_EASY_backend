const express = require("express");
const bcrypt = require("bcryptjs");
const prisma = require("../config/prismaclient.js");

const { signToken, verifyToken } = require("../middleware/auth.js");

const { validateEmail, validatePassword } = require("../utils/validators.js");

const router = express.Router();

router.post("/signup", async (req, res) => {
  try {
    console.log("Signup request body:", req.body); // Debugging line

    const { email, password, name, role } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }
    if (!validateEmail(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }
    if (!validatePassword(password)) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters" });
    }
    const existing = await prisma.User.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ message: "Email already in use" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.User.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: role === "ADMIN" ? "ADMIN" : "USER",
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });

    const token = signToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    res.cookie("token", token, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(201).json({ message: "user created", user });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    const user = await prisma.User.findUnique({ where: { email } });

    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const valid = await bcrypt.compare(password, user.password);
    
    if (!valid) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const token = signToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    res.cookie("token", token, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    const safeUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };
    res.json({ message: "Logged in", user: safeUser });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/logout", verifyToken, (req, res) => {
  res.clearCookie("token", { httpOnly: true, sameSite: "lax" });
  res.json({ message: "Logged out" });
});

module.exports = { router };
