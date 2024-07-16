import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config({ path: "./.env" });

import app from "./app.js";

const DB = process.env.DATABSE.replace("<PASSWORD>", process.env.DATABASE_PASSWORD);

mongoose.connect(DB).then(() => console.log("DB Connected Successfully"));
// .catch((err) => console.log(`DB Connection Error -> ${err.message}`));

const port = process.env.PORT || 9000;
const localHost = "127.0.0.1";

const server = app.listen(port, localHost, () => {
    console.log(`Server is running on port ${port} ...`);
});

process.on("unhandledRejection", (err) => {
    console.log(err.name, err.message);
    console.log(`unhandledRejection 💥 Shutting down...`);
    server.close(() => process.exit(1));
});
