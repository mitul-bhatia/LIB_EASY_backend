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
        userType: "Staff",
        userFullName: "Admin User",
        employeeId: "ADMIN001",
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
        userType: "Student",
        userFullName: "John Doe",
        admissionId: "STU001",
        email: "john@student.com",
        password: hashedPassword,
        mobileNumber: "2222222222",
        isAdmin: false,
      },
    });
    console.log("✅ Student 1 created:", student1.email);

    const student2 = await prisma.user.create({
      data: {
        userType: "Student",
        userFullName: "Jane Smith",
        admissionId: "STU002",
        email: "jane@student.com",
        password: hashedPassword,
        mobileNumber: "3333333333",
        isAdmin: false,
      },
    });
    console.log("✅ Student 2 created:", student2.email);

    // Create Staff User
    console.log("\nCreating staff user...");
    const staff = await prisma.user.create({
      data: {
        userType: "Staff",
        userFullName: "Bob Wilson",
        employeeId: "EMP001",
        email: "bob@staff.com",
        password: hashedPassword,
        mobileNumber: "4444444444",
        isAdmin: false,
      },
    });
    console.log("✅ Staff created:", staff.email);

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
    console.log("✅ Categories created: Fiction, Science, Programming, History");

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

    console.log("✅ Books created: 4 books");

    // Update categories with book references
    await prisma.bookCategory.update({
      where: { id: programming.id },
      data: { books: [book1.id] },
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

    console.log("\n✅ Database seeded successfully!\n");
    console.log("=" .repeat(60));
    console.log("LOGIN CREDENTIALS (Password for all: password123)");
    console.log("=" .repeat(60));
    console.log("\n👤 ADMIN:");
    console.log("   Employee ID: ADMIN001");
    console.log("   Email: admin@library.com");
    console.log("   Password: password123");
    console.log("\n👤 STUDENT 1:");
    console.log("   Admission ID: STU001");
    console.log("   Email: john@student.com");
    console.log("   Password: password123");
    console.log("\n👤 STUDENT 2:");
    console.log("   Admission ID: STU002");
    console.log("   Email: jane@student.com");
    console.log("   Password: password123");
    console.log("\n👤 STAFF:");
    console.log("   Employee ID: EMP001");
    console.log("   Email: bob@staff.com");
    console.log("   Password: password123");
    console.log("\n" + "=".repeat(60));
    console.log("\n📚 4 Books created");
    console.log("📂 4 Categories created");
    console.log("\n");

    process.exit(0);
  } catch (err) {
    console.error("❌ Seeding failed:", err);
    process.exit(1);
  }
}

seed();
