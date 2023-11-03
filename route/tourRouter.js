const express = require('express');
const tourController = require('./../controllers/tourController');
const authController = require('./../controllers/authController');
const reviewRouter = require('./../route/reviewRouter');
const router = express.Router();
// router.param('id', tourController.checkId);
// /:x == x means variable change with req
router.use('/:tourId/reviews', reviewRouter);
router
  .route('/top-5-cheap')
  .get(tourController.aliasTopTours, tourController.getAllTours);
router.route('/tour-stats').get(tourController.getTourStats);
router
  .route('/monthly-plan/:year')
  .get(
    authController.protectRoutes,
    authController.restrictTo('admin', 'lead-guide', 'guide'),
    tourController.getMonthlyPlan
  );

router
  .route('/tour-within/:distance/center/:latlng/unit/:unit')
  .get(tourController.getToursWithin);
router.route('/distances/:latlng/unit/:unit').get(tourController.getDistances);
router
  .route('/')
  .get(tourController.getAllTours)
  .post(
    authController.protectRoutes,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.createTour
  );
// router
//   .route('/:id')
//   .get(tourController.getTour)
//   .delete(
//     authController.protectRoutes,
//     authController.restrictTo('admin', 'lead-guide'),
//     tourController.deleteTour
//   );
router
  .route('/:id')
  .get(tourController.getTour)
  .patch(
    authController.protectRoutes,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.uploadTourImages,
    tourController.resizeTourImages,
    tourController.updateTour
  )
  .delete(
    authController.protectRoutes,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.deleteTour
  );

/*
 *** exports objects we return a functionality not code all code run here then
 return the work of it
 */
module.exports = router;
