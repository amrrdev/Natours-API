import mongoose, { set } from "mongoose";
import slugify from "slugify";
import validator from "validator";
const tourSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "A tour must have a name"],
            unique: [true, "A tour must have a unique name"],
            trim: true,
            maxLength: [40, "A tour name must have less or equal then 40 characters"],
            minLength: [10, "A tour name musta have more or equal than 10 characters"],
            // validate: [validator.isAlpha, "Tour name must only contans character"],
        },
        slug: String,
        duration: {
            type: Number,
            required: [true, "A tour must have a duration"],
        },
        maxGroupSize: {
            type: Number,
            required: [true, "A tour must have a gorup size"],
        },
        difficulty: {
            type: String,
            required: [true, "A tour must have a difficulty"],
            enum: {
                values: ["easy", "medium", "difficult"],
                message: "difficulty is either: easy, medium, difficult",
            },
        },
        ratingsAverage: {
            type: Number,
            default: 4.5,
            min: [1, "rating must be above 1.0"],
            max: [5, "ratings must be below 5.0"],
            set: (val) => Math.round(val * 10) / 10,
        },
        ratingsQuantity: {
            type: Number,
            default: 0,
        },
        price: {
            type: Number,
            required: [true, "A tour must have a price"],
        },
        priceDiscount: {
            type: Number,
            validate: {
                validator: function (value) {
                    return value < this.price;
                },
                message: "Discount price should be below the regular price",
            },
        },
        summary: {
            type: String,
            trim: true,
            required: [true, "A Tour must have a description"],
        },
        description: {
            type: String,
            trim: true,
        },
        imageCover: {
            type: String,
            required: [true, "A tour must hava a cover image"],
        },
        images: [String],
        createdAt: {
            type: Date,
            default: Date.now(),
            select: false,
        },
        startDates: [Date],
        secretTour: {
            type: Boolean,
            default: false,
        },
        startLocations: {
            type: {
                type: String,
                default: "Point",
                enum: ["Point"],
            },
            coordinates: {
                type: [Number],
                index: "2dsphere", // Ensure 2dsphere index for GeoJSON points
            },
            address: String,
            description: String,
        },
        locations: [
            {
                type: {
                    type: String,
                    default: "Point",
                    enum: ["Point"],
                },
                coordinates: [Number],
                address: String,
                description: String,
                day: Number,
            },
        ],
        guides: [
            {
                type: mongoose.Schema.ObjectId,
                ref: "User",
            },
        ],
    },
    {
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// indexing
tourSchema.index({ price: 1, ratingsAverage: -1 });
tourSchema.index({ slug: 1 });
tourSchema.index({ startLocations: "2dsphere" });

// not work with insert many.
tourSchema.pre("save", function (next) {
    this.slug = slugify(this.name, { lower: true });
    next();
});

tourSchema.pre(/^find/, function (next) {
    this.find({ secretTour: { $ne: true } });
    next();
});

tourSchema.pre(/^find/, function (next) {
    this.populate({
        path: "guides",
        select: "-__v",
    });
    next();
});

tourSchema.pre("aggregate", function (next) {
    next();
});

tourSchema.virtual("durationWeeks").get(function () {
    return this.duration / 7;
});

tourSchema.virtual("reviews", {
    ref: "Review",
    foreignField: "tour",
    localField: "_id",
});

const Tour = mongoose.model("tours", tourSchema);
export default Tour;
