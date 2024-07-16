import mongoose from "mongoose";
import Tour from "./tourModel.js";
import User from "./userModel.js";
const reviewSchema = new mongoose.Schema(
    {
        review: {
            type: String,
            required: [true, "Review Can not be empty"],
        },
        rating: {
            type: Number,
            min: [1, "rating must be above 1.0"],
            max: [5, "rating must be below 5.0"],
        },
        createdAt: {
            type: Date,
            default: Date.now(),
        },
        tour: {
            type: mongoose.Schema.ObjectId,
            ref: "tour",
            required: [true, "Review must belong to a tour."],
        },
        user: {
            type: mongoose.Schema.ObjectId,
            ref: "user",
            required: [true, "Review must belong to a user."],
        },
    },
    {
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

reviewSchema.pre(/^find/, function (next) {
    this.populate({
        path: "user",
        select: "name photo",
        model: User,
    });
    next();
});

reviewSchema.statics.calcAverageRatings = async function (tourId) {
    const stats = await this.aggregate([
        {
            $match: { tour: tourId },
        },
        {
            $group: {
                _id: "$tour",
                nRatings: { $sum: 1 },
                avgRatings: { $avg: "$rating" },
            },
        },
    ]);
    if (stats.length)
        await Tour.findByIdAndUpdate(tourId, {
            ratingsQuantity: stats[0].nRatings,
            ratingsAverage: stats[0].avgRatings,
        });
    else
        await Tour.findByIdAndUpdate(tourId, {
            ratingsQuantity: 0,
            ratingsAverage: 4.5,
        });
};

reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

reviewSchema.pre(/^findOneAnd/, async function (next) {
    this.r = await this.clone().findOne();
    next();
});

reviewSchema.post("save", function () {
    this.constructor.calcAverageRatings(this.tour);
});

reviewSchema.post(/^findOneAnd/, async function () {
    await this.r.constructor.calcAverageRatings(this.r.tour);
});

const Review = mongoose.model("Review", reviewSchema);

export default Review;
