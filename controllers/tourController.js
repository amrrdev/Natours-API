import Tour from "../models/tourModel.js";
import APIFeatures from "../utils/apiFeatures.js";
import AppError from "../utils/appError.js";
import catchAsync from "../utils/catchAsync.js";
import * as factory from "./handlerFactory.js";

export const aliasTopTours = async (req, res, next) => {
    req.query.limit = 5;
    req.query.sort = "-ratingsAverage price";
    req.query.fields = "name price ratingsAverage summary difficulty";
    next();
};

export const getAllTours = factory.getAll(Tour);
export const getTourById = factory.getOne(Tour, { path: "reviews" });
export const createTour = factory.createOne(Tour);
export const updateTour = factory.updateOne(Tour);
export const deleteTour = factory.deleteOne(Tour);

export const getTourStats = catchAsync(async (req, res, next) => {
    const stats = await Tour.aggregate([
        {
            $match: { ratingsAverage: { $gte: 4.5 } },
        },
        {
            $group: {
                _id: "$difficulty",
                numTours: { $sum: 1 },
                numRatings: { $sum: "$ratingsQuantity" },
                avgRating: { $avg: "$ratingsAverage" },
                avgPrice: { $avg: "$price" },
                minPrice: { $min: "$price" },
                maxPrice: { $max: "$price" },
            },
        },
        {
            $sort: { avgPrice: -1 },
        },
    ]);

    res.status(200).json({
        status: "success",
        data: { stats },
    });
});

/**
 *
 * @param {Req} req
 * @param {Res} res
 */

export const getMonthlyPlan = catchAsync(async (req, res, next) => {
    const year = Number(req.params.year);
    const plan = await Tour.aggregate([
        {
            $unwind: "$startDates",
        },
        {
            $match: {
                startDates: {
                    $gte: new Date(`${year}-01-01`),
                    $lte: new Date(`${year}-12-31`),
                },
            },
        },
        {
            $group: {
                _id: { $month: "$startDates" },
                numTours: { $sum: 1 },
                tours: { $push: "$name" },
            },
        },
        {
            $addFields: { month: "$_id" },
        },
        {
            $project: { _id: 0 },
        },
        {
            $sort: { numTours: -1 },
        },
    ]);
    res.status(200).json({
        result: plan.length,
        status: "amr",
        data: { plan },
    });
});

// "/tours-within/:distance/center/:latlng/unit/:unit"
export const getTourWithin = catchAsync(async (req, res, next) => {
    const { distance, latlng, unit } = req.params;
    const [lat, lng] = latlng.split(",");

    if (!lat || !lng)
        return next(
            new AppError("Please Provide latitutr and longitude in the format lat,lng.", 400)
        );

    const radius = unit === "mi" ? distance / 3963.2 : distance / 6378.1;

    const tours = await Tour.find({
        startLocations: {
            $geoWithin: { $centerSphere: [[lng, lat], radius] },
        },
    });
    res.status(200).json({
        status: "success",
        result: tours.length,
        data: {
            documents: tours,
        },
    });
});

export const getDistances = catchAsync(async (req, res, next) => {
    const { latlng, unit } = req.params;
    const [lat, lng] = latlng.split(",");

    if (!lat || !lng)
        return next(
            new AppError("Please Provide latitutr and longitude in the format lat,lng.", 400)
        );
    const multiplier = unit === "mi" ? 0.000621371 : 0.001;

    const distance = await Tour.aggregate([
        {
            $geoNear: {
                near: {
                    type: "Point",
                    coordinates: [lng * 1, lat * 1],
                },
                distanceField: "distance",
                distanceMultiplier: multiplier,
            },
        },
        {
            $project: {
                distance: 1,
                name: 1,
            },
        },
    ]);
    res.status(200).json({
        status: "success",
        data: {
            documents: distance,
        },
    });
});
