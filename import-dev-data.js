import fs from "node:fs";
import Tour from "./models/tourModel.js";
import User from "./models/userModel.js";
import Review from "./models/reviewModel.js";
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config({ path: "./.env" });

const tours = JSON.parse(fs.readFileSync(`./dev-data/data/tours.json`, "utf-8"));
const users = JSON.parse(fs.readFileSync(`./dev-data/data/users.json`, "utf-8"));
const reviews = JSON.parse(fs.readFileSync(`./dev-data/data/reviews.json`, "utf-8"));

const DB = process.env.DATABSE.replace("<PASSWORD>", process.env.DATABASE_PASSWORD);

mongoose
    .connect(DB)
    .then(() => console.log("DB Connected Successfully"))
    .catch((err) => console.log(`DB Connection Error -> ${err.message}`));

const importData = async () => {
    try {
        await Tour.create(tours);
        await User.create(users, { validateBeforeSave: false });
        await Review.create(reviews);
        console.log(`Data imported Successfully`);
    } catch (err) {
        console.log(`Error while importing data -> ${err.message}`);
    }
    process.exit();
};

const deleteData = async () => {
    try {
        await Tour.deleteMany();
        await User.deleteMany();
        await Review.deleteMany();
        console.log(`Data Deleted Successfully`);
    } catch (err) {
        console.log(`Error while importing data -> ${err.message}`);
    }
    process.exit();
};

if (process.argv[2] === "--import") importData();
else if (process.argv[2] === "--delete") deleteData();
