import { router as tourRouter } from "./routes/tourRoutes.js";
import { router as userRouter } from "./routes/userRoutes.js";
import reviewRouter from "./routes/reviewRoutes.js";
import AppError from "./utils/appError.js";
import globalErrorHandler from "./controllers/errorController.js";

import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import morgan from "morgan";
import mongoSanitize from "express-mongo-sanitize";
import xss from "xss-clean";

const app = express();

// Set Security http headers
app.use(helmet());

// print information about each request hit the server
app.use(morgan("dev"));

// limit number of requests that hit the server in specific period of time
// rateLimter func returns a middleware
const limiter = rateLimit({
    max: 100,
    windowMs: 60 * 60 * 1000,
    message: "Too Many Requests From This IP, plases try again in an hour",
});

app.use("/api", limiter);
// parse incoming json data into request body
app.use(express.json({ limit: "10kb" }));

// mongo sanitize
app.use(mongoSanitize());

// xss -> clean anu milisies code
app.use(xss());

// servering static files
app.use(express.static(`${import.meta.dirname}/public`));

// test middlewares
app.use((req, res, next) => {
    req.requestTime = new Date().toUTCString();
    // console.log(req.headers);
    next();
});

app.use("/api/v1/tours", tourRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/reviews", reviewRouter);
// handle undefined route
app.all("*", (req, res, next) => {
    next(new AppError(`Can't fint ${req.url} on this server`, 404));
});

// Global Error Handling Middleware
app.use(globalErrorHandler);

export default app;
