import * as tourController from "./../controllers/tourController.js";
import * as authController from "./../controllers/authController.js";
import reviewRouter from "./reviewRoutes.js";
import express from "express";

const router = express.Router();
/**
 * This "router" is specifically for tours, so any middleware called on this
 * router has access to the parameters and body for tours only, not any other routers.
 */

router.use("/:tourId/reviews", reviewRouter);

router.route("/top-5-cheap").get(tourController.aliasTopTours, tourController.getAllTours);
router.route("/tour-stats").get(tourController.getTourStats);
router
    .route("/monthly-plan/:year")
    .get(
        authController.protect,
        authController.restrictTo("admin", "lead-guide", "guide"),
        tourController.getMonthlyPlan
    );

router.route("/tours-within/:distance/center/:latlng/unit/:unit").get(tourController.getTourWithin);
router.route("/distances/:latlng/unit/:unit").get(tourController.getDistances);
router
    .route("/")
    .get(tourController.getAllTours)
    .post(
        authController.protect,
        authController.restrictTo("admin", "lead-guide"),
        tourController.createTour
    );
router
    .route("/:id")
    .get(tourController.getTourById)
    .patch(
        authController.protect,
        authController.restrictTo("admin", "lead-guide"),
        tourController.updateTour
    )
    .delete(
        authController.protect,
        authController.restrictTo("admin", "lead-guide"),
        tourController.deleteTour
    );

export { router };
