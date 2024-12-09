import mongoose from "mongoose";

import { configDotenv } from "dotenv";

import dotenv from "dotenv"
import { DB_NAME } from "./constant.js";
import express from "express";
import connectdb from "./db/index.js";
const app = express()

dotenv.config({ path: './env'})

connectdb()
.then(()=>{
    app.listen(process.env.PORT || 8000, ()=>{
        console.log(`server is running at port ${process.env.PORT}`);

    })
})
.catch((err)=>{
    console.log("Error",err);
})

