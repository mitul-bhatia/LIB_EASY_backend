const express = require("express");
const prisma = require("../config/prismaclient.js");

const router = express.Router();

// POST /api/transactions/add-transaction - Create new transaction
router.post("/add-transaction", async (req, res) => {
  try {
    const { isAdmin } = req.body;

    if (!isAdmin) {
      return res.status(403).json({ message: "Admin access required" });
    }

    const {
      bookId,
      borrowerId,
      bookName,
      borrowerName,
      transactionType,
      fromDate,
      toDate,
    } = req.body;

    // Validate required fields
    if (
      !bookId ||
      !borrowerId ||
      !bookName ||
      !borrowerName ||
      !transactionType ||
      !fromDate ||
      !toDate
    ) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Validate transaction type
    if (transactionType !== "Issued" && transactionType !== "Reserved") {
      return res
        .status(400)
        .json({ message: "Transaction type must be Issued or Reserved" });
    }

    // Validate date range
    const from = new Date(fromDate);
    const to = new Date(toDate);
    if (to < from) {
      return res
        .status(400)
        .json({ message: "To date cannot be earlier than from date" });
    }

    // Get book and check availability for Issue transactions
    const book = await prisma.book.findUnique({ where: { id: bookId } });
    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }

    if (transactionType === "Issued" && book.bookCountAvailable <= 0) {
      return res.status(400).json({ message: "Book not available for issue" });
    }

    // Create transaction
    const transaction = await prisma.bookTransaction.create({
      data: {
        bookId,
        borrowerId,
        bookName,
        borrowerName,
        transactionType,
        fromDate,
        toDate,
        transactionStatus: "Active",
      },
    });

    // Update book: decrement count and add transaction
    await prisma.book.update({
      where: { id: bookId },
      data: {
        bookCountAvailable: book.bookCountAvailable - 1,
        transactions: [...book.transactions, transaction.id],
      },
    });

    // Get user and add to active transactions
    const user = await prisma.user.findFirst({ where: { admissionId: borrowerId } });
    if (!user) {
      const staffUser = await prisma.user.findFirst({ where: { employeeId: borrowerId } });
      if (staffUser) {
        await prisma.user.update({
          where: { id: staffUser.id },
          data: {
            activeTransactions: [...staffUser.activeTransactions, transaction.id],
          },
        });
      }
    } else {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          activeTransactions: [...user.activeTransactions, transaction.id],
        },
      });
    }

    res.status(200).json(transaction);
  } catch (err) {
    console.error("Add transaction error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/transactions/all-transactions - Get all transactions
router.get("/all-transactions", async (req, res) => {
  try {
    const transactions = await prisma.bookTransaction.findMany({
      orderBy: { createdAt: "desc" },
    });
    res.status(200).json(transactions);
  } catch (err) {
    console.error("Get all transactions error:", err);
    res.status(504).json({ message: "Error fetching transactions" });
  }
});

// PUT /api/transactions/update-transaction/:id - Update transaction
router.put("/update-transaction/:id", async (req, res) => {
  try {
    const { isAdmin } = req.body;

    if (!isAdmin) {
      return res.status(403).json({ message: "Admin access required" });
    }

    const { id } = req.params;
    const { isAdmin: _, ...updateData } = req.body;

    await prisma.bookTransaction.update({
      where: { id },
      data: updateData,
    });

    res.status(200).json({ message: "Transaction updated successfully" });
  } catch (err) {
    console.error("Update transaction error:", err);
    res.status(504).json({ message: "Error updating transaction" });
  }
});

// DELETE /api/transactions/remove-transaction/:id - Delete transaction
router.delete("/remove-transaction/:id", async (req, res) => {
  try {
    const { isAdmin } = req.body;

    if (!isAdmin) {
      return res.status(403).json({ message: "Admin access required" });
    }

    const { id } = req.params;

    // Get transaction to find book
    const transaction = await prisma.bookTransaction.findUnique({
      where: { id },
    });

    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    // Remove from book's transactions
    const book = await prisma.book.findUnique({
      where: { id: transaction.bookId },
    });
    if (book) {
      const updatedTransactions = book.transactions.filter((txId) => txId !== id);
      await prisma.book.update({
        where: { id: transaction.bookId },
        data: { transactions: updatedTransactions },
      });
    }

    // Delete transaction
    await prisma.bookTransaction.delete({ where: { id } });

    res.status(200).json({ message: "Transaction deleted successfully" });
  } catch (err) {
    console.error("Delete transaction error:", err);
    res.status(504).json({ message: "Error deleting transaction" });
  }
});

// POST /api/transactions/return/:id - Process book return
router.post("/return/:id", async (req, res) => {
  try {
    const { isAdmin } = req.body;

    if (!isAdmin) {
      return res.status(403).json({ message: "Admin access required" });
    }

    const { id } = req.params;

    // Get transaction
    const transaction = await prisma.bookTransaction.findUnique({
      where: { id },
    });

    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    // Calculate fine
    const currentDate = new Date();
    const toDate = new Date(transaction.toDate);
    const daysOverdue = Math.floor(
      (currentDate - toDate) / (1000 * 60 * 60 * 24)
    );
    const fine = daysOverdue > 0 ? daysOverdue * 10 : 0;

    // Update transaction
    const returnDate = currentDate.toLocaleDateString("en-US");
    await prisma.bookTransaction.update({
      where: { id },
      data: {
        transactionStatus: "Completed",
        returnDate,
      },
    });

    // Increment book count
    const book = await prisma.book.findUnique({
      where: { id: transaction.bookId },
    });
    if (book) {
      await prisma.book.update({
        where: { id: transaction.bookId },
        data: {
          bookCountAvailable: book.bookCountAvailable + 1,
        },
      });
    }

    // Move transaction from active to previous for user
    const user = await prisma.user.findFirst({
      where: { admissionId: transaction.borrowerId },
    });
    if (!user) {
      const staffUser = await prisma.user.findFirst({
        where: { employeeId: transaction.borrowerId },
      });
      if (staffUser) {
        const updatedActive = staffUser.activeTransactions.filter(
          (txId) => txId !== id
        );
        const updatedPrev = [...staffUser.prevTransactions, id];
        await prisma.user.update({
          where: { id: staffUser.id },
          data: {
            activeTransactions: updatedActive,
            prevTransactions: updatedPrev,
          },
        });
      }
    } else {
      const updatedActive = user.activeTransactions.filter((txId) => txId !== id);
      const updatedPrev = [...user.prevTransactions, id];
      await prisma.user.update({
        where: { id: user.id },
        data: {
          activeTransactions: updatedActive,
          prevTransactions: updatedPrev,
        },
      });
    }

    res.status(200).json({
      message: "Book returned successfully",
      fine,
      returnDate,
    });
  } catch (err) {
    console.error("Return book error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = { router };
