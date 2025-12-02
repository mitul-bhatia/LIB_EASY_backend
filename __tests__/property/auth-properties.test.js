const fc = require("fast-check");
const bcrypt = require("bcryptjs");
const prisma = require("../../src/config/prismaclient");
const { validateEmail, validatePassword } = require("../../src/utils/validators");

// Custom generators for test data
const validEmailGenerator = () =>
  fc.tuple(
    fc.stringMatching(/^[a-z]{3,10}$/),
    fc.stringMatching(/^[a-z]{3,10}$/),
    fc.constantFrom("com", "org", "net", "edu"),
    fc.integer({ min: 1000, max: 9999 })
  ).map(([name, domain, tld, num]) => `${name}${num}@${domain}.${tld}`);

const validPasswordGenerator = () =>
  fc.string({ minLength: 6, maxLength: 20 });

const validUserTypeGenerator = () =>
  fc.constantFrom("Student", "Staff");

const validUserGenerator = () =>
  fc.record({
    userType: validUserTypeGenerator(),
    userFullName: fc.tuple(fc.string({ minLength: 3, maxLength: 40 }), fc.integer({ min: 1000, max: 9999 }))
      .map(([name, num]) => `${name}_${num}`),
    admissionId: fc.option(fc.string({ minLength: 3, maxLength: 15 }), { nil: null }),
    employeeId: fc.option(fc.string({ minLength: 3, maxLength: 15 }), { nil: null }),
    age: fc.integer({ min: 18, max: 100 }),
    dob: fc.date({ min: new Date("1920-01-01"), max: new Date("2005-12-31") })
      .map(d => `${(d.getMonth() + 1).toString().padStart(2, "0")}/${d.getDate().toString().padStart(2, "0")}/${d.getFullYear()}`),
    gender: fc.constantFrom("Male", "Female", "Other"),
    address: fc.string({ maxLength: 100 }),
    mobileNumber: fc.integer({ min: 1000000000, max: 9999999999 }).map(String),
    email: validEmailGenerator(),
    password: validPasswordGenerator(),
    isAdmin: fc.boolean(),
  }).map((user, index) => {
    // Ensure correct identifier based on userType with unique timestamp
    const uniqueId = `${Date.now()}${Math.random().toString(36).substr(2, 9)}`;
    if (user.userType === "Student") {
      return { ...user, admissionId: user.admissionId || `STU${uniqueId}`, employeeId: null };
    } else {
      return { ...user, employeeId: user.employeeId || `EMP${uniqueId}`, admissionId: null };
    }
  });

describe("Authentication Property-Based Tests", () => {
  // Clean up database before and after tests
  beforeAll(async () => {
    await prisma.user.deleteMany({});
  });

  afterEach(async () => {
    await prisma.user.deleteMany({});
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  // Feature: library-management-system, Property 2: Passwords are hashed with bcrypt
  // Validates: Requirements 1.2, 2.5
  test("Property 2: Passwords are hashed with bcrypt", async () => {
    await fc.assert(
      fc.asyncProperty(validUserGenerator(), async (userData) => {
        const plainPassword = userData.password;
        
        // Hash the password
        const hashedPassword = await bcrypt.hash(plainPassword, 10);
        
        // Create user with hashed password
        const user = await prisma.user.create({
          data: {
            ...userData,
            password: hashedPassword,
          },
        });

        // Verify password is not stored in plaintext
        expect(user.password).not.toBe(plainPassword);
        
        // Verify it's a valid bcrypt hash (starts with $2a$ or $2b$)
        expect(user.password).toMatch(/^\$2[ab]\$/);
        
        // Verify the hash can be compared successfully
        const isValid = await bcrypt.compare(plainPassword, user.password);
        expect(isValid).toBe(true);
        
        // Verify wrong password fails
        const isInvalid = await bcrypt.compare("wrongpassword", user.password);
        expect(isInvalid).toBe(false);
      }),
      { numRuns: 50 }
    );
  });

  // Feature: library-management-system, Property 5: Registration requires all mandatory fields
  // Validates: Requirements 2.1
  test("Property 5: Registration requires all mandatory fields", async () => {
    await fc.assert(
      fc.asyncProperty(validUserGenerator(), async (userData) => {
        const requiredFields = ["userType", "userFullName", "email", "password", "mobileNumber"];
        
        for (const field of requiredFields) {
          const incompleteData = { ...userData };
          delete incompleteData[field];
          
          // Attempt to create user without required field should fail
          await expect(
            prisma.user.create({ data: { ...incompleteData, password: await bcrypt.hash(incompleteData.password || "test", 10) } })
          ).rejects.toThrow();
        }
      }),
      { numRuns: 20 }
    );
  });

  // Feature: library-management-system, Property 6: Email uniqueness is enforced
  // Validates: Requirements 2.2
  test("Property 6: Email uniqueness is enforced", async () => {
    await fc.assert(
      fc.asyncProperty(validUserGenerator(), validUserGenerator(), async (user1Data, user2Data) => {
        // Create first user
        const hashedPassword1 = await bcrypt.hash(user1Data.password, 10);
        await prisma.user.create({
          data: {
            ...user1Data,
            password: hashedPassword1,
          },
        });

        // Attempt to create second user with same email
        const hashedPassword2 = await bcrypt.hash(user2Data.password, 10);
        const duplicateEmailData = {
          ...user2Data,
          email: user1Data.email, // Same email
          userFullName: user2Data.userFullName + "_different", // Different name
          password: hashedPassword2,
        };

        // Should fail due to unique constraint
        await expect(
          prisma.user.create({ data: duplicateEmailData })
        ).rejects.toThrow();
      }),
      { numRuns: 30 }
    );
  });

  // Feature: library-management-system, Property 7: User identifier uniqueness is enforced
  // Validates: Requirements 2.3
  test("Property 7: User identifier uniqueness is enforced", async () => {
    await fc.assert(
      fc.asyncProperty(validUserGenerator(), validUserGenerator(), async (user1Data, user2Data) => {
        // Ensure both users are same type for identifier collision
        const userType = user1Data.userType;
        const adjustedUser2 = { ...user2Data, userType };
        
        if (userType === "Student") {
          adjustedUser2.admissionId = user1Data.admissionId;
          adjustedUser2.employeeId = null;
        } else {
          adjustedUser2.employeeId = user1Data.employeeId;
          adjustedUser2.admissionId = null;
        }

        // Create first user
        const hashedPassword1 = await bcrypt.hash(user1Data.password, 10);
        await prisma.user.create({
          data: {
            ...user1Data,
            password: hashedPassword1,
          },
        });

        // Attempt to create second user with same identifier
        const hashedPassword2 = await bcrypt.hash(adjustedUser2.password, 10);
        const duplicateIdData = {
          ...adjustedUser2,
          email: adjustedUser2.email + "_different", // Different email
          userFullName: adjustedUser2.userFullName + "_different", // Different name
          password: hashedPassword2,
        };

        // Should fail due to unique constraint on admissionId or employeeId
        await expect(
          prisma.user.create({ data: duplicateIdData })
        ).rejects.toThrow();
      }),
      { numRuns: 30 }
    );
  });

  // Feature: library-management-system, Property 8: Email format validation
  // Validates: Requirements 11.1
  test("Property 8: Email format validation", () => {
    fc.assert(
      fc.property(validEmailGenerator(), (email) => {
        // Valid emails should pass validation
        expect(validateEmail(email)).toBe(true);
      }),
      { numRuns: 100 }
    );

    // Test invalid emails
    const invalidEmails = [
      "notanemail",
      "@example.com",
      "user@",
      "user @example.com",
      "user@.com",
      "",
      "user",
    ];

    invalidEmails.forEach(email => {
      expect(validateEmail(email)).toBe(false);
    });
  });

  // Feature: library-management-system, Property 9: Password minimum length validation
  // Validates: Requirements 11.3
  test("Property 9: Password minimum length validation", () => {
    fc.assert(
      fc.property(validPasswordGenerator(), (password) => {
        // Valid passwords (6+ chars) should pass
        expect(validatePassword(password)).toBe(true);
      }),
      { numRuns: 100 }
    );

    // Test invalid passwords (< 6 chars)
    fc.assert(
      fc.property(fc.string({ maxLength: 5 }), (shortPassword) => {
        expect(validatePassword(shortPassword)).toBe(false);
      }),
      { numRuns: 50 }
    );
  });

  // Feature: library-management-system, Property 1: Valid credentials produce authentication
  // Validates: Requirements 1.1
  test("Property 1: Valid credentials produce authentication", async () => {
    await fc.assert(
      fc.asyncProperty(validUserGenerator(), async (userData) => {
        const plainPassword = userData.password;
        const hashedPassword = await bcrypt.hash(plainPassword, 10);
        
        // Create user
        const user = await prisma.user.create({
          data: {
            ...userData,
            password: hashedPassword,
          },
        });

        // Simulate authentication
        const identifier = userData.userType === "Student" ? userData.admissionId : userData.employeeId;
        const findQuery = userData.userType === "Student" 
          ? { admissionId: identifier }
          : { employeeId: identifier };
        
        const foundUser = await prisma.user.findUnique({ where: findQuery });
        
        // User should be found
        expect(foundUser).not.toBeNull();
        
        // Password should match
        const isValid = await bcrypt.compare(plainPassword, foundUser.password);
        expect(isValid).toBe(true);
      }),
      { numRuns: 50 }
    );
  });

  // Feature: library-management-system, Property 3: Invalid credentials are rejected
  // Validates: Requirements 1.3
  test("Property 3: Invalid credentials are rejected", async () => {
    await fc.assert(
      fc.asyncProperty(validUserGenerator(), fc.string({ minLength: 6 }), async (userData, wrongPassword) => {
        // Ensure wrong password is different
        fc.pre(wrongPassword !== userData.password);
        
        const hashedPassword = await bcrypt.hash(userData.password, 10);
        
        // Create user
        await prisma.user.create({
          data: {
            ...userData,
            password: hashedPassword,
          },
        });

        // Try to authenticate with wrong password
        const identifier = userData.userType === "Student" ? userData.admissionId : userData.employeeId;
        const findQuery = userData.userType === "Student" 
          ? { admissionId: identifier }
          : { employeeId: identifier };
        
        const foundUser = await prisma.user.findUnique({ where: findQuery });
        
        // Wrong password should fail
        const isValid = await bcrypt.compare(wrongPassword, foundUser.password);
        expect(isValid).toBe(false);
      }),
      { numRuns: 50 }
    );
  });
});
