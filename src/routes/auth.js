const express = require("express");
const bcrypt = require("bcryptjs");
const prisma = require("../config/prismaclient.js");

const { signToken, verifyToken } = require("../middleware/auth.js");

const { validateEmail, validatePassword } = require("../utils/validators.js");

const router = express.Router();

router.post("/signup", async (req, res) => {
  try {
    console.log("Signup request body:", req.body);

    const {
      userType,
      userFullName,
      admissionId,
      employeeId,
      age,
      dob,
      gender,
      address,
      mobileNumber,
      email,
      password,
      isAdmin,
    } = req.body;

    // Validate required fields
    if (!userType || !userFullName || !email || !password || !mobileNumber) {
      return res.status(400).json({
        message: "Required fields: userType, userFullName, email, password, mobileNumber",
      });
    }

    // Validate userType
    if (userType !== "Student" && userType !== "Staff") {
      return res.status(400).json({ message: "userType must be 'Student' or 'Staff'" });
    }

    // Validate identifier based on userType
    if (userType === "Student" && !admissionId) {
      return res.status(400).json({ message: "admissionId is required for students" });
    }
    if (userType === "Staff" && !employeeId) {
      return res.status(400).json({ message: "employeeId is required for staff" });
    }

    // Validate email format
    if (!validateEmail(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    // Validate password length
    if (!validatePassword(password)) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    // Check for existing email
    const existingEmail = await prisma.user.findUnique({ where: { email } });
    if (existingEmail) {
      return res.status(409).json({ message: "Email already in use" });
    }

    // Check for existing admissionId or employeeId
    if (admissionId) {
      const existingAdmission = await prisma.user.findUnique({
        where: { admissionId },
      });
      if (existingAdmission) {
        return res.status(409).json({ message: "Admission ID already in use" });
      }
    }

    if (employeeId) {
      const existingEmployee = await prisma.user.findUnique({
        where: { employeeId },
      });
      if (existingEmployee) {
        return res.status(409).json({ message: "Employee ID already in use" });
      }
    }

    // Hash password with bcrypt (salt rounds 10)
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const userData = {
      userType,
      userFullName,
      mobileNumber: mobileNumber.toString(),
      email,
      password: hashedPassword,
      isAdmin: isAdmin === true || isAdmin === "true",
    };

    // Add optional fields only if provided
    if (admissionId) userData.admissionId = admissionId;
    if (employeeId) userData.employeeId = employeeId;
    if (age) userData.age = parseInt(age);
    if (dob) userData.dob = dob;
    if (gender) userData.gender = gender;
    if (address) userData.address = address;

    const user = await prisma.user.create({
      data: userData,
      select: {
        id: true,
        userType: true,
        userFullName: true,
        admissionId: true,
        employeeId: true,
        age: true,
        dob: true,
        gender: true,
        address: true,
        mobileNumber: true,
        email: true,
        points: true,
        isAdmin: true,
        createdAt: true,
      },
    });

    const token = signToken({
      id: user.id,
      email: user.email,
      isAdmin: user.isAdmin,
    });

    res.cookie("token", token, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(201).json({ message: "User created successfully", user });
  } catch (err) {
    console.error("Signup error:", err);
    console.error("Error details:", err.message);
    console.error("Error stack:", err.stack);
    return res.status(500).json({ 
      message: "Server error", 
      error: process.env.NODE_ENV === 'development' ? err.message : undefined 
    });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { admissionId, employeeId, password } = req.body;

    if (!password) {
      return res.status(400).json({ message: "Password is required" });
    }

    if (!admissionId && !employeeId) {
      return res.status(400).json({
        message: "Either admissionId or employeeId is required",
      });
    }

    // Find user by admissionId or employeeId
    let user = null;
    if (admissionId) {
      user = await prisma.user.findUnique({ where: { admissionId } });
    } else if (employeeId) {
      user = await prisma.user.findUnique({ where: { employeeId } });
    }

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Compare password
    const valid = await bcrypt.compare(password, user.password);

    if (!valid) {
      return res.status(400).json({ message: "Invalid password" });
    }

    const token = signToken({
      id: user.id,
      email: user.email,
      isAdmin: user.isAdmin,
    });

    res.cookie("token", token, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // Return user without password
    const safeUser = {
      id: user.id,
      userType: user.userType,
      userFullName: user.userFullName,
      admissionId: user.admissionId,
      employeeId: user.employeeId,
      email: user.email,
      isAdmin: user.isAdmin,
      points: user.points,
    };

    res.json({ message: "Logged in successfully", user: safeUser });
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
