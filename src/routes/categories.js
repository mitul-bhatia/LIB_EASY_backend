const express = require("express");
const prisma = require("../config/prismaclient.js");

const router = express.Router();

// GET /api/categories/allcategories - Get all categories
router.get("/allcategories", async (req, res) => {
  try {
    const categories = await prisma.bookCategory.findMany({
      orderBy: { createdAt: "desc" },
    });
    res.status(200).json(categories);
  } catch (err) {
    console.error("Get all categories error:", err);
    res.status(504).json({ message: "Error fetching categories" });
  }
});

// POST /api/categories/addcategory - Create new category
router.post("/addcategory", async (req, res) => {
  try {
    const { categoryName } = req.body;

    if (!categoryName) {
      return res.status(400).json({ message: "Category name is required" });
    }

    const category = await prisma.bookCategory.create({
      data: { categoryName },
    });

    res.status(200).json(category);
  } catch (err) {
    console.error("Add category error:", err);
    if (err.code === "P2002") {
      return res.status(409).json({ message: "Category already exists" });
    }
    res.status(504).json({ message: "Error creating category" });
  }
});

module.exports = { router };
