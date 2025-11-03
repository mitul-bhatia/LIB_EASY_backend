// prisma/seed.js
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Clear existing data (optional)
  await prisma.user.deleteMany();
  await prisma.book.deleteMany();

  console.log('🧹 Old data cleared.');

  // Hash passwords
  const hashedPassword = await bcrypt.hash('password123', 10);

  // Sample user data
  const users = [
    {
      email: 'admin@example.com',
      password: hashedPassword,
      name: 'Admin User',
      role: 'ADMIN',
    },
    {
      email: 'john@example.com',
      password: hashedPassword,
      name: 'John Doe',
      role: 'USER',
    },
    {
      email: 'emma@example.com',
      password: hashedPassword,
      name: 'Emma Watson',
      role: 'USER',
    },
    {
      email: 'raj@example.com',
      password: hashedPassword,
      name: 'Raj Kumar',
      role: 'USER',
    },
    {
      email: 'mia@example.com',
      password: hashedPassword,
      name: 'Mia Smith',
      role: 'USER',
    },
  ];

  // Insert all users
  await prisma.user.createMany({ data: users });

  console.log('✅ 5 users added successfully!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
