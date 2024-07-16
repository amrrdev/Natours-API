import Review from "./../models/reviewModel.js";
import * as factory from "./handlerFactory.js";

export const setTourUserIds = (req, res, next) => {
    req.body.tour = req.body.tour || req.params.tourId;
    req.body.user = req.body.user || req.user.id;
    next();
};

export const getAllReviwe = factory.getAll(Review);
export const getReview = factory.getOne(Review);
export const createReview = factory.createOne(Review);
export const deleteReview = factory.deleteOne(Review);
export const updateReview = factory.updateOne(Review);
