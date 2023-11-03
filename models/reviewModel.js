const mongoose = require(`mongoose`);
const Tour = require('./../models/toursmodel');
const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'review is must'],
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: [true, 'enter your rating'],
    },
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'rev must have user'],
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'rev must have tour'],
    },
  },
  {
    toJSON: { virtuals: true },
    toJSON: { virtuals: true },
  }
);
reviewSchema.pre(/^find/, function (next) {
  // all strings start with find
  this.populate({
    path: 'user',
    select: 'name',
  });
  next();
});

///// Important We Have methods we user in other files
//// But now we will use (statics) we Can Use in SChema itself
reviewSchema.statics.calcAverageRating = async function (tourId) {
  const stats = await this.aggregate([
    {
      $match: { tour: tourId },
    },
    {
      $group: {
        _id: '$tour',
        numRating: { $sum: 1 },
        ratingsAvg: { $avg: '$rating' },
      },
    },
  ]);
  if (stats.length > 0) {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsAverage: stats[0].ratingsAvg,
      ratingsQuantity: stats[0].numRating,
    });
  } else {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsAverage: 0,
      ratingsQuantity: 4.5,
    });
  }
};
reviewSchema.index({ tour: 1, user: 1 }, { unique: true });
reviewSchema.post('save', function () {
  //////// statics methods use for Review(Model) it
  //// we don't define model so use constructor
  this.constructor.calcAverageRating(this.tour);
});
///
// START :: NOW WE LEARN HOW TO PASS VALUES FROM MIDDLEWARE TO ANTHER IN SCHEMA
reviewSchema.pre(/^findOneAnd/, async function (next) {
  this.r = await this.findOne();
  next();
});
reviewSchema.post(/^findOneAnd/, async function () {
  // this.r = await this.findOne();//  DON'T WORK,BECAUSE QUERY EXECUTED ALREADY
  await this.r.constructor.calcAverageRating(this.r.tour);
});
// ::: END
const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
