require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const { router: authRouter } = require('./routes/auth.js');
const { router: usersRouter } = require('./routes/users.js');
const { router: booksRouter } = require('./routes/books.js');
const { router: categoriesRouter } = require('./routes/categories.js');
const { router: transactionsRouter } = require('./routes/transactions.js');

const app = express();

app.use(express.json());
app.use(cookieParser());

app.use(cors({
    origin: process.env.FRONTEND_ORIGIN || 'http://localhost:3000',
    credentials: true,  
}))

app.use("/api/auth", authRouter);
app.use("/api/users", usersRouter);
app.use("/api/books", booksRouter);
app.use("/api/categories", categoriesRouter);
app.use("/api/transactions", transactionsRouter);



app.get("/api/health",(req,res)=>res.json({status:"ok"}))

const PORT = process.env.PORT ;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});