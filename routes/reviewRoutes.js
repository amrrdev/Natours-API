import * as reviewController from "./../controllers/reviewController.js";
import * as authController from "./../controllers/authController.js";
import express from "express";

const router = express.Router({ mergeParams: true });

router.use(authController.protect);

router
    .route("/")
    .get(reviewController.getAllReviwe)
    .post(
        authController.restrictTo("user"),
        reviewController.setTourUserIds,
        reviewController.createReview
    );

router
    .route("/:id")
    .get(reviewController.getReview)
    .patch(authController.restrictTo("user", "admin"), reviewController.updateReview)
    .delete(authController.restrictTo("user", "admin"), reviewController.deleteReview);

export default router;
