const express = require("express");
const bcrypt = require("bcryptjs");
const prisma = require("../config/prismaclient.js");
const { verifyToken } = require("../middleware/auth.js");

const router = express.Router();

// GET /api/users/getuser/:id - Get single user with populated transactions
router.get("/getuser/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        userFullName: true,
        memberId: true,
        age: true,
        dob: true,
        gender: true,
        address: true,
        mobileNumber: true,
        email: true,
        points: true,
        activeTransactions: true,
        prevTransactions: true,
        isAdmin: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Fetch transaction details for active and previous transactions
    const activeTransactionDetails = await Promise.all(
      user.activeTransactions.map(async (txId) => {
        return await prisma.bookTransaction.findUnique({ where: { id: txId } });
      })
    );

    const prevTransactionDetails = await Promise.all(
      user.prevTransactions.map(async (txId) => {
        return await prisma.bookTransaction.findUnique({ where: { id: txId } });
      })
    );

    const userWithTransactions = {
      ...user,
      activeTransactions: activeTransactionDetails.filter(Boolean),
      prevTransactions: prevTransactionDetails.filter(Boolean),
    };

    res.json(userWithTransactions);
  } catch (err) {
    console.error("Get user error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/users/allmembers - Get all users with transactions
router.get("/allmembers", async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        userFullName: true,
        memberId: true,
        age: true,
        dob: true,
        gender: true,
        address: true,
        mobileNumber: true,
        email: true,
        points: true,
        activeTransactions: true,
        prevTransactions: true,
        isAdmin: true,
        createdAt: true,
      },
    });

    // Populate transactions for each user
    const usersWithTransactions = await Promise.all(
      users.map(async (user) => {
        const activeTransactionDetails = await Promise.all(
          user.activeTransactions.map(async (txId) => {
            return await prisma.bookTransaction.findUnique({ where: { id: txId } });
          })
        );

        const prevTransactionDetails = await Promise.all(
          user.prevTransactions.map(async (txId) => {
            return await prisma.bookTransaction.findUnique({ where: { id: txId } });
          })
        );

        return {
          ...user,
          activeTransactions: activeTransactionDetails.filter(Boolean),
          prevTransactions: prevTransactionDetails.filter(Boolean),
        };
      })
    );

    res.json(usersWithTransactions);
  } catch (err) {
    console.error("Get all members error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// PUT /api/users/updateuser/:id - Update user
router.put("/updateuser/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, isAdmin, password, ...updateData } = req.body;

    // Authorization check: user can update own profile OR requester is admin
    if (userId !== id && !isAdmin) {
      return res.status(403).json({ message: "Unauthorized to update this user" });
    }

    // If password is being updated, hash it
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updateData.password = hashedPassword;
    }

    await prisma.user.update({
      where: { id },
      data: updateData,
    });

    res.json({ message: "User updated successfully" });
  } catch (err) {
    console.error("Update user error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// DELETE /api/users/deleteuser/:id - Delete user
router.delete("/deleteuser/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, isAdmin } = req.body;

    // Authorization check: user can delete own account OR requester is admin
    if (userId !== id && !isAdmin) {
      return res.status(403).json({ message: "Unauthorized to delete this user" });
    }

    await prisma.user.delete({
      where: { id },
    });

    res.json({ message: "User deleted successfully" });
  } catch (err) {
    console.error("Delete user error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// PUT /api/users/:id/move-to-activetransactions - Add transaction to active list
router.put("/:id/move-to-activetransactions", async (req, res) => {
  try {
    const { id: transactionId } = req.params;
    const { userId, isAdmin } = req.body;

    // Admin authorization required
    if (!isAdmin) {
      return res.status(403).json({ message: "Admin access required" });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        activeTransactions: {
          push: transactionId,
        },
      },
    });

    res.json({ message: "Transaction added to active list" });
  } catch (err) {
    console.error("Move to active transactions error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// PUT /api/users/:id/move-to-prevtransactions - Move transaction to previous list
router.put("/:id/move-to-prevtransactions", async (req, res) => {
  try {
    const { id: transactionId } = req.params;
    const { userId, isAdmin } = req.body;

    // Admin authorization required
    if (!isAdmin) {
      return res.status(403).json({ message: "Admin access required" });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Remove from active and add to previous
    const updatedActiveTransactions = user.activeTransactions.filter(
      (txId) => txId !== transactionId
    );
    const updatedPrevTransactions = [...user.prevTransactions, transactionId];

    await prisma.user.update({
      where: { id: userId },
      data: {
        activeTransactions: updatedActiveTransactions,
        prevTransactions: updatedPrevTransactions,
      },
    });

    res.json({ message: "Transaction moved to previous list" });
  } catch (err) {
    console.error("Move to previous transactions error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = { router };
