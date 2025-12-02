const prisma = require("./src/config/prismaclient");

async function cleanupTransactions() {
  try {
    console.log("🧹 Cleaning up all transactions...\n");

    // Get all transactions
    const allTransactions = await prisma.bookTransaction.findMany();
    console.log(`Found ${allTransactions.length} transactions to delete`);

    // Delete all transactions
    await prisma.bookTransaction.deleteMany({});
    console.log("✅ All transactions deleted\n");

    // Reset all users' transaction arrays
    console.log("Resetting user transaction arrays...");
    const users = await prisma.user.findMany();
    for (const user of users) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          activeTransactions: [],
          prevTransactions: [],
        },
      });
    }
    console.log(`✅ Reset transaction arrays for ${users.length} users\n`);

    // Reset all books' transaction arrays and restore book counts
    console.log("Resetting book transaction arrays and restoring counts...");
    const books = await prisma.book.findMany();
    for (const book of books) {
      await prisma.book.update({
        where: { id: book.id },
        data: {
          transactions: [],
          // You may want to manually set bookCountAvailable to original values
          // For now, we'll just clear transactions
        },
      });
    }
    console.log(`✅ Reset transaction arrays for ${books.length} books\n`);

    console.log("=" .repeat(60));
    console.log("✅ CLEANUP COMPLETE!");
    console.log("=" .repeat(60));
    console.log("\n📊 Summary:");
    console.log(`   - Deleted ${allTransactions.length} transactions`);
    console.log(`   - Reset ${users.length} user records`);
    console.log(`   - Reset ${books.length} book records`);
    console.log("\n💡 Note: You may want to run seed.js to restore book counts\n");

    process.exit(0);
  } catch (err) {
    console.error("❌ Cleanup failed:", err);
    process.exit(1);
  }
}

cleanupTransactions();
