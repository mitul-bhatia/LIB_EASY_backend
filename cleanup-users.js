const prisma = require("./src/config/prismaclient");

async function cleanup() {
  try {

    const result = await prisma.user.deleteMany({});
    console.log(`Deleted ${result.count} users`);
    process.exit(0);
  } catch (err) {
    console.error("Error:", err.message);
    process.exit(1);
  }
}

cleanup();
