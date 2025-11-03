require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const {router }  = require('./routes/auth.js');

const app = express();

app.use(express.json());
app.use(cookieParser());

app.use(cors({
    origin: process.env.FRONTEND_ORIGIN || 'http://localhost:3000',
    credentials: true,  
}))

app.use("/api/auth",router)



app.get("/api/health",(req,res)=>res.json({status:"ok"}))

const PORT = process.env.PORT ;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});