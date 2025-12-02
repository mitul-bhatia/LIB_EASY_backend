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

    // Create Books
    console.log("\nCreating books...");
    const book1 = await prisma.book.create({
      data: {
        bookName: "Clean Code",
        author: "Robert C. Martin",
        bookCountAvailable: 5,
        language: "English",
        publisher: "Prentice Hall",
        isbn: "978-0132350884",
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
        categories: [programming.id, technology.id],
      },
    });

    console.log("✅ Books created: 5 books");

    // Update categories with book references
    await prisma.bookCategory.update({
      where: { id: programming.id },
      data: { books: [book1.id, book5.id] },
    });
    await prisma.bookCategory.update({
      where: { id: fiction.id },
      data: { books: [book2.id] },
    });
    await prisma.bookCategory.update({
      where: { id: science.id },
      data: { books: [book3.id] },
    });
    await prisma.bookCategory.update({
      where: { id: history.id },
      data: { books: [book4.id] },
    });
    await prisma.bookCategory.update({
      where: { id: technology.id },
      data: { books: [book5.id] },
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
    console.log("\n📚 5 Books created");
    console.log("📂 5 Categories created");
    console.log("👥 4 Users created (1 Admin, 3 Students)");
    console.log("\n");

    process.exit(0);
  } catch (err) {
    console.error("❌ Seeding failed:", err);
    process.exit(1);
  }
}

se