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
    // Try to find by memberId first, then by email
    let user = await prisma.user.findFirst({ where: { memberId: borrowerId } });
    if (!user) {
      user = await prisma.user.findFirst({ where: { email: borrowerId } });
    }
    
    if (user) {
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

// POST /api/transactions/request-book - Student requests a book
router.post("/request-book", async (req, res) => {
  try {
    const { bookId, userId, fromDate, toDate } = req.body;

    if (!bookId || !userId || !fromDate || !toDate) {
      return res.status(400).json({ message: "Book ID, User ID, From Date, and To Date are required" });
    }

    // Get user details
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Get book details
    const book = await prisma.book.findUnique({ where: { id: bookId } });
    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }

    // Check if user already has this book (active transaction)
    const existingTransaction = await prisma.bookTransaction.findFirst({
      where: {
        bookId: bookId,
        borrowerId: user.memberId || user.email,
        transactionStatus: { in: ["Pending", "Active"] },
      },
    });

    if (existingTransaction) {
      return res.status(400).json({ 
        message: "You already have a request or active transaction for this book" 
      });
    }

    // Create pending transaction with user-specified duration
    const transaction = await prisma.bookTransaction.create({
      data: {
        bookId: book.id,
        borrowerId: user.memberId || user.email,
        bookName: book.bookName,
        borrowerName: user.userFullName,
        transactionType: "Issued",
        transactionStatus: "Pending",
        fromDate,
        toDate,
      },
    });

    res.status(200).json({
      message: "Book request submitted successfully! Admin will review your request.",
      transaction,
    });
  } catch (err) {
    console.error("Request book error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/transactions/approve/:id - Admin approves a book request (directly issues)
router.post("/approve/:id", async (req, res) => {
  try {
    const { isAdmin } = req.body;
    const { id } = req.params;

    if (!isAdmin) {
      return res.status(403).json({ message: "Admin access required" });
    }

    // Get transaction
    const transaction = await prisma.bookTransaction.findUnique({
      where: { id },
    });

    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    if (transaction.transactionStatus !== "Pending") {
      return res.status(400).json({ message: "Only pending requests can be approved" });
    }

    // Get book
    const book = await prisma.book.findUnique({
      where: { id: transaction.bookId },
    });

    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }

    // Check availability
    if (book.bookCountAvailable <= 0) {
      return res.status(400).json({ message: "Book is not available" });
    }

    // Update transaction status to Active (directly issued with user-specified duration)
    await prisma.bookTransaction.update({
      where: { id },
      data: {
        transactionStatus: "Active",
        transactionType: "Issued",
      },
    });

    // Decrement book count and add to book's transactions
    await prisma.book.update({
      where: { id: transaction.bookId },
      data: {
        bookCountAvailable: book.bookCountAvailable - 1,
        transactions: [...book.transactions, transaction.id],
      },
    });

    // Add to user's active transactions
    let user = await prisma.user.findFirst({
      where: { memberId: transaction.borrowerId },
    });
    if (!user) {
      user = await prisma.user.findFirst({
        where: { email: transaction.borrowerId },
      });
    }

    if (user) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          activeTransactions: [...user.activeTransactions, transaction.id],
        },
      });
    }

    res.status(200).json({
      message: "Request approved! Book has been issued to the student.",
      transaction,
    });
  } catch (err) {
    console.error("Approve request error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/transactions/reject/:id - Admin rejects a book request
router.post("/reject/:id", async (req, res) => {
  try {
    const { isAdmin } = req.body;
    const { id } = req.params;

    if (!isAdmin) {
      return res.status(403).json({ message: "Admin access required" });
    }

    // Get transaction
    const transaction = await prisma.bookTransaction.findUnique({
      where: { id },
    });

    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    if (transaction.transactionStatus !== "Pending") {
      return res.status(400).json({ message: "Only pending requests can be rejected" });
    }

    // Delete the transaction
    await prisma.bookTransaction.delete({
      where: { id },
    });

    res.status(200).json({
      message: "Request rejected successfully",
    });
  } catch (err) {
    console.error("Reject request error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/transactions/cancel/:id - Student cancels their own request
router.post("/cancel/:id", async (req, res) => {
  try {
    const { userId } = req.body;
    const { id } = req.params;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    // Get transaction
    const transaction = await prisma.bookTransaction.findUnique({
      where: { id },
    });

    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    // Get user
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Verify ownership
    const borrowerId = user.memberId || user.email;
    if (transaction.borrowerId !== borrowerId) {
      return res.status(403).json({ message: "You can only cancel your own requests" });
    }

    if (transaction.transactionStatus !== "Pending") {
      return res.status(400).json({ 
        message: "Only pending requests can be cancelled. Contact admin for approved requests." 
      });
    }

    // Delete the transaction
    await prisma.bookTransaction.delete({
      where: { id },
    });

    res.status(200).json({
      message: "Request cancelled successfully",
    });
  } catch (err) {
    console.error("Cancel request error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/transactions/mark-issued/:id - Admin marks reserved book as issued (picked up)
router.post("/mark-issued/:id", async (req, res) => {
  try {
    const { isAdmin } = req.body;
    const { id } = req.params;

    if (!isAdmin) {
      return res.status(403).json({ message: "Admin access required" });
    }

    // Get transaction
    const transaction = await prisma.bookTransaction.findUnique({
      where: { id },
    });

    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    if (transaction.transactionStatus !== "Reserved") {
      return res.status(400).json({ message: "Only reserved books can be marked as issued" });
    }

    // Update transaction status to Active (book is now with student)
    await prisma.bookTransaction.update({
      where: { id },
      data: {
        transactionStatus: "Active",
        transactionType: "Issued",
      },
    });

    res.status(200).json({
      message: "Book marked as issued successfully",
    });
  } catch (err) {
    console.error("Mark issued error:", err);
    res.status(500).json({ message: "Server error" });
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
    // Try to find by memberId first, then by email
    let user = await prisma.user.findFirst({
      where: { memberId: transaction.borrowerId },
    });
    if (!user) {
      user = await prisma.user.findFirst({
        where: { email: transaction.borrowerId },
      });
    }
    
    if (user) {
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
