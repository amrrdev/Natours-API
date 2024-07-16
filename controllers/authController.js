import { promisify } from "node:util";
import crypto from "node:crypto";

import User from "./../models/userModel.js";
import catchAsync from "./../utils/catchAsync.js";
import AppError from "./../utils/appError.js";
import sendEmail from "./../utils/email.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config({ path: "./../.env" });

const generateJwtToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN,
    });
};

const createSendToken = (user, statusCode, res) => {
    const token = generateJwtToken(user._id);

    const cookieOptions = {
        expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000),
        // the cookie will not be modified or changed by the browser
        httpOnly: true,
    };

    if (process.env.NODE_ENV === "production")
        // secure for https (secure connection)
        cookieOptions.secure = true;

    res.cookie("jwt", token, cookieOptions);
    user.password = undefined;
    res.status(statusCode).json({
        status: "seccess",
        token,
        data: { user },
    });
};

export const signup = catchAsync(async (req, res, next) => {
    const newUser = await User.create({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        passwordConfirm: req.body.passwordConfirm,
        role: req.body.role || "user",
    });

    createSendToken(newUser, 201, res);
});

export const login = catchAsync(async (req, res, next) => {
    const { email, password } = req.body;

    // chech if email and poassword exist
    if (!email || !password) return next(new AppError("missing email or password", 400));

    // chech if user exists && passowrd is correct
    // (.select()) => to allow the passowrd to apper
    const user = await User.findOne({ email }).select("+password");
    if (!user || !(await user.correctPassword(password, user.password)))
        return next(new AppError("Invalid email or password", 401));

    //send token to client
    createSendToken(user, 200, res);
});

export const protect = catchAsync(async (req, res, next) => {
    // Getting token and check check if it's there
    // -> note that the token should be send by the header
    // follow the convintion -> Authorization: Bearer <JWT Token>
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
        token = req.headers.authorization.split(" ")[1];
    }
    if (!token)
        return next(new AppError("Your are not logged in! Please log in to get access.", 401));

    // Verification Token
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
    console.log(decoded);
    // check if user change the password after  the token was issued
    const freshUser = await User.findById(decoded.id);
    if (!freshUser) next(new AppError("User no longer exists", 401));

    // if (!freshUser.changedPasswordAfter(decoded.iat))
    // next(new AppError("User recently changed password, Please log in again!", 401));
    req.user = freshUser;
    next();
});

export const restrictTo = (...roles) => {
    return catchAsync(async (req, res, next) => {
        if (!roles.includes(req.user.role))
            return next(new AppError("You do not have permission to perform this action", 403));
        next();
    });
};

export const forgetPassword = catchAsync(async (req, res, next) => {
    //1) - get user based on POSTed email
    const user = await User.findOne({ email: req.body.email });
    if (!user) return next(new AppError("there is no user with that email eddress", 404));

    //2) - generate the reset token and send it via email
    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    const resetURL = `${req.protocol}://${req.get(
        "host"
    )}/api/v1/users/resetPassword/${resetToken}`;

    const message = `Forget your password motherfucker? Submit a PATCH request with your new password and password confirm to: ${resetURL}.
    \nif you didn't forget your password, please ignore this email`;

    try {
        await sendEmail({
            email: user.email,
            subject: "Your password reset token (valid for 10 minute)",
            message,
        });
        res.status(200).json({
            status: "success",
            message: "token send to email",
        });
    } catch (err) {
        user.passwordResetToken = undefined;
        user.passwordResetExprires = undefined;
        await user.save({ validateBeforeSave: false });
        return next(new AppError("there was an error sending the email. Try again", 500));
    }
});

export const resetPassword = catchAsync(async (req, res, next) => {
    // 1)- Get user based on the token
    const hasedToken = crypto.createHash("sha256").update(req.params.token).digest("hex");
    const user = await User.findOne({
        passwordResetToken: hasedToken,
        passwordResetExprires: { $gt: Date.now() },
    });
    // 2)- if token has not expired, and there is user, set the new password
    if (!user) next(new AppError("Token is invalid or has expired", 400));

    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    user.passwordResetToken = undefined;
    user.passwordResetExprires = undefined;
    await user.save();

    // Update changedPasswordAt property for the user
    createSendToken(user, 200, res);
});

export const updatePassword = catchAsync(async (req, res, next) => {
    // get the user from db
    const user = await User.findById(req.user.id).select("+password");
    // check for the current password
    if (!(await user.correctPassword(req.body.passwordCurrent, user.password)))
        return next(new AppError("Your current password is wrong!", 401));
    //update passwoed
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    await user.save();
    // send token
    createSendToken(user, 200, res);
});
