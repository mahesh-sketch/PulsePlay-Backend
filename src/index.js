// require("dotenv").config({ path: "./env" });
import dotenv from "dotenv";

import connectDB from "./db/index.js";
import { app } from "./app.js";

dotenv.config({
  path: "./env",
});

connectDB()
  .then(() => {
    app.listen(process.env.PORT || 8000, () => {
      console.log(`Server is Running at port ${process.env.PORT}`);
    });
  })
  .catch((err) => {
    console.log("MONGO DB connecttin Failed !!", err);
  });

/*
import mongoose from "mongoose";
import { DB_NAME } from "./constant";
import express from "express";

const app = express();
(async () => {
  try {
    await mongoose.connect(`${process.env.MONGODB_URL}/
    ${DB_NAME}`);
    app.on("error", (error) => {
      console.log("Error:", error);
      throw error;
    });

    app.listen(process.env.PORT, () => {
      console.log(`App is listening at port ${process.env.PORT}`);
    });
  } catch (error) {
    console.log("Error:", error);
    throw error;
  }
})();*/
