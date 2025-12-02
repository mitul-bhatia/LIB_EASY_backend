const express = require("express");
const prisma = require("../config/prismaclient.js");

const router = express.Router();

// GET /api/books/allbooks - Get all books with transactions
router.get("/allbooks", async (req, res) => {
  try {
    const books = await prisma.book.findMany({
      orderBy: { createdAt: "desc" },
    });

    // Populate transactions for each book
    const booksWithTransactions = await Promise.all(
      books.map(async (book) => {
        const transactions = await Promise.all(
          book.transactions.map(async (txId) => {
            return await prisma.bookTransaction.findUnique({ where: { id: txId } });
          })
        );
        return { ...book, transactions: transactions.filter(Boolean) };
      })
    );

    res.status(200).json(booksWithTransactions);
  } catch (err) {
    console.error("Get all books error:", err);
    res.status(504).json({ message: "Error fetching books" });
  }
});

// GET /api/books/getbook/:id - Get single book
router.get("/getbook/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const book = await prisma.book.findUnique({
      where: { id },
    });

    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }

    // Populate transactions
    const transactions = await Promise.all(
      book.transactions.map(async (txId) => {
        return await prisma.bookTransaction.findUnique({ where: { id: txId } });
      })
    );

    res.status(200).json({ ...book, transactions: transactions.filter(Boolean) });
  } catch (err) {
    console.error("Get book error:", err);
    res.status(500).json({ message: "Error fetching book" });
  }
});

// GET /api/books?category=<categoryName> - Get books by category
router.get("/", async (req, res) => {
  try {
    const { category } = req.query;

    if (!category) {
      return res.status(400).json({ message: "Category parameter required" });
    }

    const categoryData = await prisma.bookCategory.findUnique({
      where: { categoryName: category },
    });

    if (!categoryData) {
      return res.status(404).json({ message: "Category not found" });
    }

    // Get all books in this category
    const books = await Promise.all(
      categoryData.books.map(async (bookId) => {
        return await prisma.book.findUnique({ where: { id: bookId } });
      })
    );

    res.status(200).json({
      ...categoryData,
      books: books.filter(Boolean),
    });
  } catch (err) {
    console.error("Get books by category error:", err);
    res.status(504).json({ message: "Error fetching books" });
  }
});

// POST /api/books/addbook - Add new book
router.post("/addbook", async (req, res) => {
  try {
    const { isAdmin } = req.body;

    if (!isAdmin) {
      return res.status(403).json({ message: "Admin access required" });
    }

    const {
      bookName,
      alternateTitle,
      author,
      bookCountAvailable,
      language,
      publisher,
      categories,
    } = req.body;

    // Validate required fields
    if (!bookName || !author || bookCountAvailable === undefined) {
      return res.status(400).json({
        message: "Required fields: bookName, author, bookCountAvailable",
      });
    }

    if (bookCountAvailable < 0) {
      return res.status(400).json({ message: "Book count cannot be negative" });
    }

    // Create book
    const book = await prisma.book.create({
      data: {
        bookName,
        alternateTitle: alternateTitle || "",
        author,
        bookCountAvailable: parseInt(bookCountAvailable),
        language: language || "",
        publisher: publisher || "",
        categories: categories || [],
      },
    });

    // Create bidirectional references - add book to categories
    if (categories && categories.length > 0) {
      await Promise.all(
        categories.map(async (categoryId) => {
          const category = await prisma.bookCategory.findUnique({
            where: { id: categoryId },
          });
          if (category) {
            await prisma.bookCategory.update({
              where: { id: categoryId },
              data: {
                books: [...category.books, book.id],
              },
            });
          }
        })
      );
    }

    res.status(200).json(book);
  } catch (err) {
    console.error("Add book error:", err);
    res.status(504).json({ message: "Error adding book" });
  }
});

// PUT /api/books/updatebook/:id - Update book
router.put("/updatebook/:id", async (req, res) => {
  try {
    const { isAdmin } = req.body;

    if (!isAdmin) {
      return res.status(403).json({ message: "Admin access required" });
    }

    const { id } = req.params;
    const { isAdmin: _, ...updateData } = req.body;

    await prisma.book.update({
      where: { id },
      data: updateData,
    });

    res.status(200).json({ message: "Book updated successfully" });
  } catch (err) {
    console.error("Update book error:", err);
    res.status(504).json({ message: "Error updating book" });
  }
});

// DELETE /api/books/removebook/:id - Delete book
router.delete("/removebook/:id", async (req, res) => {
  try {
    const { isAdmin } = req.body;

    if (!isAdmin) {
      return res.status(403).json({ message: "Admin access required" });
    }

    const { id } = req.params;

    // Get book to find its categories
    const book = await prisma.book.findUnique({ where: { id } });

    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }

    // Remove book from all categories
    if (book.categories && book.categories.length > 0) {
      await Promise.all(
        book.categories.map(async (categoryId) => {
          const category = await prisma.bookCategory.findUnique({
            where: { id: categoryId },
          });
          if (category) {
            const updatedBooks = category.books.filter((bookId) => bookId !== id);
            await prisma.bookCategory.update({
              where: { id: categoryId },
              data: { books: updatedBooks },
            });
          }
        })
      );
    }

    // Delete the book
    await prisma.book.delete({ where: { id } });

    res.status(200).json({ message: "Book deleted successfully" });
  } catch (err) {
    console.error("Delete book error:", err);
    res.status(504).json({ message: "Error deleting book" });
  }
});

module.exports = { router };
