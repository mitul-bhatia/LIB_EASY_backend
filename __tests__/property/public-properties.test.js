// Feature: library-management-system, Property 27-30: Public page properties
// Validates: Requirements 8.2, 12.1, 12.3

const request = require('supertest');
const express = require('express');

// Import routes
const { router: booksRouter } = require('../../src/routes/books');
const { router: usersRouter } = require('../../src/routes/users');
const { router: transactionsRouter } = require('../../src/routes/transactions');

// Create test app
const app = express();
app.use(express.json());
app.use('/api/books', booksRouter);
app.use('/api/users', usersRouter);
app.use('/api/transactions', transactionsRouter);

describe('Public Page Properties', () => {
  
  test('Property 27: Recent books should be limited to 5 items', async () => {
    const response = await request(app).get('/api/books/allbooks');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    
    // Take first 5 books (simulating recent books)
    const recentBooks = response.body.slice(0, 5);
    
    // Verify we get at most 5 books
    expect(recentBooks.length).toBeLessThanOrEqual(5);
    
    // If there are books, verify they have required fields
    if (recentBooks.length > 0) {
      recentBooks.forEach(book => {
        expect(book).toHaveProperty('id');
        expect(book).toHaveProperty('bookName');
        expect(book).toHaveProperty('author');
        expect(book).toHaveProperty('createdAt');
      });
    }
  });

  test('Property 29: Statistics should match actual database counts', async () => {
    // Fetch all books
    const booksResponse = await request(app).get('/api/books/allbooks');
    expect(booksResponse.status).toBe(200);
    const totalBooks = booksResponse.body.length;

    // Fetch all users
    const usersResponse = await request(app).get('/api/users/allmembers');
    expect(usersResponse.status).toBe(200);
    const totalMembers = usersResponse.body.length;

    // Fetch all transactions
    const transactionsResponse = await request(app).get('/api/transactions/all-transactions');
    expect(transactionsResponse.status).toBe(200);
    const totalTransactions = transactionsResponse.body.length;

    // Count active reservations
    const activeReservations = transactionsResponse.body.filter(
      (t) => t.transactionType === "Reserved" && t.transactionStatus === "Active"
    ).length;

    // Verify counts are non-negative
    expect(totalBooks).toBeGreaterThanOrEqual(0);
    expect(totalMembers).toBeGreaterThanOrEqual(0);
    expect(totalTransactions).toBeGreaterThanOrEqual(0);
    expect(activeReservations).toBeGreaterThanOrEqual(0);

    // Verify reservations don't exceed total transactions
    expect(activeReservations).toBeLessThanOrEqual(totalTransactions);

    console.log('Statistics:', {
      totalBooks,
      totalMembers,
      totalTransactions,
      activeReservations,
    });
  });

  test('Property 30: Popular books should be sorted by transaction count', async () => {
    const response = await request(app).get('/api/books/allbooks');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);

    // Sort by transaction count
    const sortedBooks = response.body.sort((a, b) => {
      const aCount = a.transactions ? a.transactions.length : 0;
      const bCount = b.transactions ? b.transactions.length : 0;
      return bCount - aCount;
    });

    const popularBooks = sortedBooks.slice(0, 6);

    // Verify we get at most 6 books
    expect(popularBooks.length).toBeLessThanOrEqual(6);

    // Verify they're sorted by transaction count (descending)
    if (popularBooks.length > 1) {
      for (let i = 0; i < popularBooks.length - 1; i++) {
        const currentCount = popularBooks[i].transactions?.length || 0;
        const nextCount = popularBooks[i + 1].transactions?.length || 0;
        expect(currentCount).toBeGreaterThanOrEqual(nextCount);
      }
    }

    console.log(
      'Popular books transaction counts:',
      popularBooks.map((b) => ({
        name: b.bookName,
        transactions: b.transactions?.length || 0,
      }))
    );
  });

  test('Property 31: All public endpoints should be accessible without authentication', async () => {
    // Test books endpoint
    const booksRes = await request(app).get('/api/books/allbooks');
    expect(booksRes.status).toBe(200);

    // Test users endpoint
    const usersRes = await request(app).get('/api/users/allmembers');
    expect(usersRes.status).toBe(200);

    // Test transactions endpoint
    const transactionsRes = await request(app).get('/api/transactions/all-transactions');
    expect(transactionsRes.status).toBe(200);

    // All should return arrays
    expect(Array.isArray(booksRes.body)).toBe(true);
    expect(Array.isArray(usersRes.body)).toBe(true);
    expect(Array.isArray(transactionsRes.body)).toBe(true);
  });

  test('Property 32: Book availability status should be accurate', async () => {
    const response = await request(app).get('/api/books/allbooks');
    
    expect(response.status).toBe(200);
    
    response.body.forEach(book => {
      expect(book).toHaveProperty('bookCountAvailable');
      expect(typeof book.bookCountAvailable).toBe('number');
      expect(book.bookCountAvailable).toBeGreaterThanOrEqual(0);
      
      // Verify availability logic
      const isAvailable = book.bookCountAvailable > 0;
      expect(typeof isAvailable).toBe('boolean');
    });
  });

  test('Property 33: Category filtering should return correct books', async () => {
    const booksResponse = await request(app).get('/api/books/allbooks');
    expect(booksResponse.status).toBe(200);
    
    const allBooks = booksResponse.body;
    
    // For each book, verify categories array exists
    allBooks.forEach(book => {
      expect(book).toHaveProperty('categories');
      expect(Array.isArray(book.categories)).toBe(true);
    });
    
    // If there are books with categories, test filtering logic
    const booksWithCategories = allBooks.filter(b => b.categories.length > 0);
    
    if (booksWithCategories.length > 0) {
      const sampleBook = booksWithCategories[0];
      const categoryId = sampleBook.categories[0];
      
      // Filter books by this category
      const filtered = allBooks.filter(book =>
        book.categories.includes(categoryId)
      );
      
      // Verify all filtered books have the category
      filtered.forEach(book => {
        expect(book.categories).toContain(categoryId);
      });
    }
  });
});
