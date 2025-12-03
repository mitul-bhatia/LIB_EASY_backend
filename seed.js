const prisma = require("./src/config/prismaclient");
const bcrypt = require("bcryptjs");

async function seed() {
  try {
    console.log("Seeding database...\n");

    // Clear existing data
    console.log("Cleaning up existing data...");
    await prisma.user.deleteMany({});
    await prisma.book.deleteMany({});
    await prisma.bookCategory.deleteMany({});
    await prisma.bookTransaction.deleteMany({});
    console.log("✅ Cleanup complete\n");

    // Password for all users: "password123"
    const hashedPassword = await bcrypt.hash("password123", 10);

    // Create Admin User
    console.log("Creating admin user...");
    const admin = await prisma.user.create({
      data: {
        userFullName: "Admin User",
        memberId: "ADMIN001",
        email: "admin@library.com",
        password: hashedPassword,
        mobileNumber: "1111111111",
        isAdmin: true,
      },
    });
    console.log("✅ Admin created:", admin.email);

    // Create Student Users
    console.log("\nCreating student users...");
    const student1 = await prisma.user.create({
      data: {
        userFullName: "John Doe",
        memberId: "STU001",
        email: "john@student.com",
        password: hashedPassword,
        mobileNumber: "2222222222",
        isAdmin: false,
        points: 100,
      },
    });
    console.log("✅ Student 1 created:", student1.email);

    const student2 = await prisma.user.create({
      data: {
        userFullName: "Jane Smith",
        memberId: "STU002",
        email: "jane@student.com",
        password: hashedPassword,
        mobileNumber: "3333333333",
        isAdmin: false,
        points: 150,
      },
    });
    console.log("✅ Student 2 created:", student2.email);

    const student3 = await prisma.user.create({
      data: {
        userFullName: "Bob Johnson",
        memberId: "STU003",
        email: "bob@student.com",
        password: hashedPassword,
        mobileNumber: "4444444444",
        isAdmin: false,
        points: 75,
      },
    });
    console.log("✅ Student 3 created:", student3.email);

    // Create Categories
    console.log("\nCreating categories...");
    const fiction = await prisma.bookCategory.create({
      data: { categoryName: "Fiction" },
    });
    const science = await prisma.bookCategory.create({
      data: { categoryName: "Science" },
    });
    const programming = await prisma.bookCategory.create({
      data: { categoryName: "Programming" },
    });
    const history = await prisma.bookCategory.create({
      data: { categoryName: "History" },
    });
    const technology = await prisma.bookCategory.create({
      data: { categoryName: "Technology" },
    });
    console.log("✅ Categories created: Fiction, Science, Programming, History, Technology");

    // Create Books with reliable cover URLs
    console.log("\nCreating books...");
    const book1 = await prisma.book.create({
      data: {
        bookName: "Clean Code",
        author: "Robert C. Martin",
        bookCountAvailable: 5,
        language: "English",
        publisher: "Prentice Hall",
        isbn: "978-0132350884",
        coverURL: "https://covers.openlibrary.org/b/isbn/9780132350884-L.jpg",
        categories: [programming.id],
      },
    });

    const book2 = await prisma.book.create({
      data: {
        bookName: "The Great Gatsby",
        author: "F. Scott Fitzgerald",
        bookCountAvailable: 3,
        language: "English",
        publisher: "Scribner",
        isbn: "978-0743273565",
        coverURL: "https://covers.openlibrary.org/b/isbn/9780743273565-L.jpg",
        categories: [fiction.id],
      },
    });

    const book3 = await prisma.book.create({
      data: {
        bookName: "A Brief History of Time",
        author: "Stephen Hawking",
        bookCountAvailable: 4,
        language: "English",
        publisher: "Bantam Books",
        isbn: "978-0553380163",
        coverURL: "https://covers.openlibrary.org/b/isbn/9780553380163-L.jpg",
        categories: [science.id],
      },
    });

    const book4 = await prisma.book.create({
      data: {
        bookName: "Sapiens",
        author: "Yuval Noah Harari",
        bookCountAvailable: 2,
        language: "English",
        publisher: "Harper",
        isbn: "978-0062316097",
        coverURL: "https://covers.openlibrary.org/b/isbn/9780062316097-L.jpg",
        categories: [history.id],
      },
    });

    const book5 = await prisma.book.create({
      data: {
        bookName: "JavaScript: The Good Parts",
        author: "Douglas Crockford",
        bookCountAvailable: 6,
        language: "English",
        publisher: "O'Reilly Media",
        isbn: "978-0596517748",
        coverURL: "https://covers.openlibrary.org/b/isbn/9780596517748-L.jpg",
        categories: [programming.id, technology.id],
      },
    });

    const book6 = await prisma.book.create({
      data: {
        bookName: "1984",
        author: "George Orwell",
        bookCountAvailable: 4,
        language: "English",
        publisher: "Signet Classic",
        isbn: "978-0451524935",
        coverURL: "https://covers.openlibrary.org/b/isbn/9780451524935-L.jpg",
        categories: [fiction.id],
      },
    });

    const book7 = await prisma.book.create({
      data: {
        bookName: "To Kill a Mockingbird",
        author: "Harper Lee",
        bookCountAvailable: 3,
        language: "English",
        publisher: "Harper Perennial",
        isbn: "978-0061120084",
        coverURL: "https://covers.openlibrary.org/b/isbn/9780061120084-L.jpg",
        categories: [fiction.id],
      },
    });

    const book8 = await prisma.book.create({
      data: {
        bookName: "The Pragmatic Programmer",
        author: "David Thomas, Andrew Hunt",
        bookCountAvailable: 5,
        language: "English",
        publisher: "Addison-Wesley",
        isbn: "978-0135957059",
        coverURL: "https://covers.openlibrary.org/b/isbn/9780135957059-L.jpg",
        categories: [programming.id],
      },
    });

    const book9 = await prisma.book.create({
      data: {
        bookName: "Atomic Habits",
        author: "James Clear",
        bookCountAvailable: 7,
        language: "English",
        publisher: "Avery",
        isbn: "978-0735211292",
        coverURL: "https://covers.openlibrary.org/b/isbn/9780735211292-L.jpg",
        categories: [history.id],
      },
    });

    const book10 = await prisma.book.create({
      data: {
        bookName: "The Lean Startup",
        author: "Eric Ries",
        bookCountAvailable: 4,
        language: "English",
        publisher: "Crown Business",
        isbn: "978-0307887894",
        coverURL: "https://covers.openlibrary.org/b/isbn/9780307887894-L.jpg",
        categories: [technology.id],
      },
    });

    const book11 = await prisma.book.create({
      data: {
        bookName: "Educated",
        author: "Tara Westover",
        bookCountAvailable: 3,
        language: "English",
        publisher: "Random House",
        isbn: "978-0399590504",
        coverURL: "https://covers.openlibrary.org/b/isbn/9780399590504-L.jpg",
        categories: [history.id],
      },
    });

    const book12 = await prisma.book.create({
      data: {
        bookName: "The Selfish Gene",
        author: "Richard Dawkins",
        bookCountAvailable: 2,
        language: "English",
        publisher: "Oxford University Press",
        isbn: "978-0198788607",
        coverURL: "https://covers.openlibrary.org/b/isbn/9780198788607-L.jpg",
        categories: [science.id],
      },
    });

    const book13 = await prisma.book.create({
      data: {
        bookName: "Design Patterns",
        author: "Gang of Four",
        bookCountAvailable: 4,
        language: "English",
        publisher: "Addison-Wesley",
        isbn: "978-0201633610",
        coverURL: "https://covers.openlibrary.org/b/isbn/9780201633610-L.jpg",
        categories: [programming.id],
      },
    });

    const book14 = await prisma.book.create({
      data: {
        bookName: "The Hobbit",
        author: "J.R.R. Tolkien",
        bookCountAvailable: 5,
        language: "English",
        publisher: "Mariner Books",
        isbn: "978-0547928227",
        coverURL: "https://covers.openlibrary.org/b/isbn/9780547928227-L.jpg",
        categories: [fiction.id],
      },
    });

    const book15 = await prisma.book.create({
      data: {
        bookName: "Cosmos",
        author: "Carl Sagan",
        bookCountAvailable: 3,
        language: "English",
        publisher: "Ballantine Books",
        isbn: "978-0345539434",
        coverURL: "https://covers.openlibrary.org/b/isbn/9780345539434-L.jpg",
        categories: [science.id],
      },
    });

    const book16 = await prisma.book.create({
      data: {
        bookName: "Thinking, Fast and Slow",
        author: "Daniel Kahneman",
        bookCountAvailable: 4,
        language: "English",
        publisher: "Farrar, Straus and Giroux",
        isbn: "978-0374533557",
        coverURL: "https://covers.openlibrary.org/b/isbn/9780374533557-L.jpg",
        categories: [history.id],
      },
    });

    const book17 = await prisma.book.create({
      data: {
        bookName: "The Art of Computer Programming",
        author: "Donald Knuth",
        bookCountAvailable: 2,
        language: "English",
        publisher: "Addison-Wesley",
        isbn: "978-0201896831",
        coverURL: "https://covers.openlibrary.org/b/isbn/9780201896831-L.jpg",
        categories: [programming.id],
      },
    });

    const book18 = await prisma.book.create({
      data: {
        bookName: "Harry Potter and the Sorcerer's Stone",
        author: "J.K. Rowling",
        bookCountAvailable: 6,
        language: "English",
        publisher: "Scholastic",
        isbn: "978-0439708180",
        coverURL: "https://covers.openlibrary.org/b/isbn/9780439708180-L.jpg",
        categories: [fiction.id],
      },
    });

    const book19 = await prisma.book.create({
      data: {
        bookName: "The Origin of Species",
        author: "Charles Darwin",
        bookCountAvailable: 3,
        language: "English",
        publisher: "John Murray",
        isbn: "978-0451529060",
        coverURL: "https://covers.openlibrary.org/b/isbn/9780451529060-L.jpg",
        categories: [science.id],
      },
    });

    const book20 = await prisma.book.create({
      data: {
        bookName: "Steve Jobs",
        author: "Walter Isaacson",
        bookCountAvailable: 4,
        language: "English",
        publisher: "Simon & Schuster",
        isbn: "978-1451648539",
        coverURL: "https://covers.openlibrary.org/b/isbn/9781451648539-L.jpg",
        categories: [history.id, technology.id],
      },
    });

    const book21 = await prisma.book.create({
      data: {
        bookName: "Introduction to Algorithms",
        author: "Thomas H. Cormen",
        bookCountAvailable: 5,
        language: "English",
        publisher: "MIT Press",
        isbn: "978-0262033848",
        coverURL: "https://covers.openlibrary.org/b/isbn/9780262033848-L.jpg",
        categories: [programming.id],
      },
    });

    const book22 = await prisma.book.create({
      data: {
        bookName: "The Catcher in the Rye",
        author: "J.D. Salinger",
        bookCountAvailable: 3,
        language: "English",
        publisher: "Little, Brown and Company",
        isbn: "978-0316769174",
        coverURL: "https://covers.openlibrary.org/b/isbn/9780316769174-L.jpg",
        categories: [fiction.id],
      },
    });

    const book23 = await prisma.book.create({
      data: {
        bookName: "Guns, Germs, and Steel",
        author: "Jared Diamond",
        bookCountAvailable: 2,
        language: "English",
        publisher: "W. W. Norton & Company",
        isbn: "978-0393317558",
        coverURL: "https://covers.openlibrary.org/b/isbn/9780393317558-L.jpg",
        categories: [history.id],
      },
    });

    const book24 = await prisma.book.create({
      data: {
        bookName: "The Double Helix",
        author: "James D. Watson",
        bookCountAvailable: 3,
        language: "English",
        publisher: "Atheneum",
        isbn: "978-0743216302",
        coverURL: "https://covers.openlibrary.org/b/isbn/9780743216302-L.jpg",
        categories: [science.id],
      },
    });

    const book25 = await prisma.book.create({
      data: {
        bookName: "Zero to One",
        author: "Peter Thiel",
        bookCountAvailable: 5,
        language: "English",
        publisher: "Crown Business",
        isbn: "978-0804139298",
        coverURL: "https://covers.openlibrary.org/b/isbn/9780804139298-L.jpg",
        categories: [technology.id],
      },
    });

    console.log("✅ Books created: 25 books with cover URLs");

    // Update categories with book references
    await prisma.bookCategory.update({
      where: { id: programming.id },
      data: { books: [book1.id, book5.id, book8.id, book13.id, book17.id, book21.id] },
    });
    await prisma.bookCategory.update({
      where: { id: fiction.id },
      data: { books: [book2.id, book6.id, book7.id, book14.id, book18.id, book22.id] },
    });
    await prisma.bookCategory.update({
      where: { id: science.id },
      data: { books: [book3.id, book12.id, book15.id, book19.id, book24.id] },
    });
    await prisma.bookCategory.update({
      where: { id: history.id },
      data: { books: [book4.id, book9.id, book11.id, book16.id, book20.id, book23.id] },
    });
    await prisma.bookCategory.update({
      where: { id: technology.id },
      data: { books: [book5.id, book10.id, book20.id, book25.id] },
    });

    console.log("\n✅ Database seeded successfully!\n");
    console.log("=" .repeat(60));
    console.log("LOGIN CREDENTIALS (Password for all: password123)");
    console.log("=" .repeat(60));
    console.log("\n👤 ADMIN:");
    console.log("   Email: admin@library.com");
    console.log("   Password: password123");
    console.log("\n👤 STUDENT 1:");
    console.log("   Email: john@student.com");
    console.log("   Password: password123");
    console.log("\n👤 STUDENT 2:");
    console.log("   Email: jane@student.com");
    console.log("   Password: password123");
    console.log("\n👤 STUDENT 3:");
    console.log("   Email: bob@student.com");
    console.log("   Password: password123");
    console.log("\n" + "=".repeat(60));
    console.log("\n📚 25 Books created (with cover images)");
    console.log("📂 5 Categories created");
    console.log("👥 4 Users created (1 Admin, 3 Students)");
    console.log("\n");

    process.exit(0);
  } catch (err) {
    console.error("❌ Seeding failed:", err);
    process.exit(1);
  }
}

seed();
