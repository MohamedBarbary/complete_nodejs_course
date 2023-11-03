const fs = require('fs');
const Tour = require('./../models/toursmodel.js');
const Factory = require('./../controllers/handleFactory.js');
const catchAsyncErrors = require('./../utls/catchAsyncError');
const AppError = require('./../utls/appError.js');
const multer = require('multer');
const sharp = require('sharp');
/*
 *** exports objects we return a functionality not code all code run here then
 return the work of it
 */
/*
  1- using try catch 
  2-using async await
*/
const multerStorage = multer.memoryStorage();
// we now filter to upload file image and prevent all files
const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('file is not an image upload images only ', 400), false);
  }
};
const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

exports.uploadTourImages = upload.fields([
  { name: 'imageCover', maxCount: 1 },
  { name: 'images', maxCount: 3 },
]);

exports.resizeTourImages = catchAsyncErrors(async (req, res, next) => {
  if (!req.files.imageCover || !req.files.images) return next();
  //1) process imageCover
  req.body.imageCover = `user-${req.params.id}-${Date.now()}-cover.jpeg`;
  await sharp(req.files.imageCover[0].buffer)
    .resize(200, 1333)
    .toFormat('jpeg')
    .jpeg({
      quality: 80,
    })
    .toFile(`public/img/tours/${req.body.imageCover}`);
  //2) other images
  req.body.images = [];
  await Promise.all(
    req.files.images.map(async (file, i) => {
      filename = `user-${req.params.id}-${Date.now()}-${i + 1}.jpeg`;
      await sharp(file.buffer)
        .resize(200, 1333)
        .toFormat('jpeg')
        .jpeg({
          quality: 80,
        })
        .toFile(`public/img/tours/${filename}`);
      req.body.images.push(filename);
    })
  );
  next();
});
exports.aliasTopTours = (req, res, next) => {
  (req.query.limit = '5'),
    (req.query.sort = '-ratingsAverage,price'),
    (req.query.fields = 'name,price,difficulty,');
  next();
};
exports.createTour = Factory.createOne(Tour);
exports.getAllTours = Factory.getAll(Tour);
exports.getTour = Factory.getOne(Tour);
exports.deleteTour = Factory.deleteOne(Tour);
exports.updateTour = Factory.updateOne(Tour);
// aggregate
// this function do pipeline of condition in mongo data
exports.getTourStats = catchAsyncErrors(async (req, res, next) => {
  const stats = await Tour.aggregate([
    // {
    //   $match: { ratingsAverage: { $gte: 4.5 } },
    // },
    {
      $group: {
        _id: { $toUpper: '$difficulty' },
        numTours: { $sum: 1 },
        numRatings: { $sum: '$ratingsQuantity' },
        avgRating: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
      },
    },
    {
      $sort: { avgPrice: 1 },
    },
  ]);
  res.status(200).json({
    status: 'success',
    data: {
      stats,
    },
  });
});

// destructure select data link startDates
exports.getMonthlyPlan = catchAsyncErrors(async (req, res, next) => {
  const year = req.params.year * 1;
  const plan = await Tour.aggregate([
    {
      $unwind: '$startDates',
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
        _id: { $month: '$startDates' },
        numTourStarts: { $sum: 1 },
        tours: { $push: '$name' },
      },
    },
    {
      $addFields: { month: '$_id' },
    },
    {
      $project: {
        _id: 0,
      },
    },
    {
      $sort: { numTourStarts: -1 },
    },
    {
      $limit: 6,
    },
  ]);
  res.status(200).json({
    status: 'success',
    data: {
      plan,
    },
  });
});
// ('tour-within/:distance/center/:latlng/unit/:unit');
exports.getToursWithin = catchAsyncErrors(async (req, res, next) => {
  const { distance, latlng, unit } = req.params;
  // mongo take distance with radians unit
  const radius = unit === 'mi' ? distance / 3963.2 : distance / 6;
  378.1;
  const [lat, lng] = latlng.split(',');
  if (!lat || !lng) {
    next(new AppError('please enter lng and lat first'), 400);
  }
  //Geospaitial-query
  //$geoWithin && $centerSphere is a special queries in mongoose
  const tours = await Tour.find({
    startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } },
  });
  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: {
      tours,
    },
  });
});
// exports.getDistances = catchAsyncErrors(async (req, res, next) => {
//   const { latlng, unit } = req.params;
//   const [lat, lng] = latlng.split(',');
//   if (!lat || !lng) {
//     next(new AppError('please enter lng and lat first'), 400);
//   }
//   // in Geo aggregate $geoNear must be first
//   // when use it must be one geo index we have it now startLocation in tourModel
//   const distances = await Tour.aggregate([
//     {
//       $geoNear: {
//         // origin point
//         near: {
//           type: 'point',
//           coordinate: [lng * 1, lat * 1],
//         },
//         distanceField: 'distances',
//       },
//     },
//   ]);
//   res.status(200).json({
//     status: 'success',
//     data: {
//       distances,
//     },
//   });
// });
exports.getDistances = catchAsyncErrors(async (req, res, next) => {
  const { latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');

  const multiplier = unit === 'mi' ? 0.000621371 : 0.001;

  if (!lat || !lng) {
    next(
      new AppError(
        'Please provide latitutr and longitude in the format lat,lng.',
        400
      )
    );
  }

  const distances = await Tour.aggregate([
    {
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [lng * 1, lat * 1],
        },
        distanceField: 'distance',
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
    status: 'success',
    data: {
      data: distances,
    },
  });
});
