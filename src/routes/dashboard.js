
const express = require("express");

const prisma = require("../config/prismaclient.js");

const router = express.Router();

router.get("books",async (req,res)=>{
    try {
        const books = await prisma.Book.findMany();
        res.status(200).json(books);
    } catch (error) {
        console.error("Error fetching books:", error);
        res.status(500).json({ message: "Internal server error" });
    }
})




