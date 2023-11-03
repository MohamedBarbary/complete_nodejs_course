const mongoose = require('mongoose');
const slugify = require('slugify');
// const validator = require('validator');
// const User = require('./userModel');
/*
  we always need scheme to store database 
  */
const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      maxLength: [24, 'name must be less than 25 char'],
      minLength: [10, 'name must be more than 9 char'],
      // validate: [validator.isAlpha, 'input must have no number'],
    },
    slug: String,
    ratingsAverage: {
      type: Number,
      default: 4,
      minValue: [0, 'rating must be above 0 '],
      maxValue: [5, 'rating must be less or = 5'],
      set: (val) => Math.round(val * 10) / 10,
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    duration: {
      type: Number,
      required: [true, 'our field must have duration'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'our field must have duration'],
    },
    difficulty: {
      type: String,
      required: [true, 'our field must have duration'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'difficulties are easy difficult medium',
      },
    },
    price: {
      type: Number,
      required: [true, 'must have price'],
    },
    priceDiscount: {
      type: Number,
      validate: {
        // work while create document only
        // there is a mpn validator you can install
        validator: function (val) {
          return val < this.price;
        },
        message: 'discount price ({VALUE}) should be below price',
      },
    },
    summery: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      required: [true, 'tour must have description'],
    },
    imageCover: {
      type: String,
      required: [true, 'tour must have a cover images'],
    },
    images: [String],
    createAdd: {
      type: Date,
      default: Date.now(),
      select: false,
    },
    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false,
    },
    startLocation: {
      //Mongo GeoJSON
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'],
      },
      coordinates: [Number],
      address: String,
      description: String,
    },
    locations: [
      {
        // its array of objects
        type: {
          type: String,
          default: 'Point',
          enum: ['Point'],
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
        ref: 'User',
      },
    ],
  },
  // after schema creating
  {
    toJSON: { virtuals: true },
    toJSON: { virtuals: true },
  }
);

tourSchema.index({ price: 1, ratingAverage: -1 });
tourSchema.index({ slug: 1 });
tourSchema.index({ startLocation: '2dsphere' });

// virtual prop not saved in our DATABASE
// all what do edit shape of original
// can not save or do crud or things like
// use normal function because it has this inside it
tourSchema.virtual('durationWeeks').get(function () {
  this.duration / 7;
});

// Virtual Populating
tourSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour',
  localField: '_id',
});
// Document MiddleWare : runs before .save() and create() only
// use normal function because it has this inside it
tourSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});
// part of embedding data
// tourSchema.pre('save', async function (next) {
//   const guidesPromises = this.guides.map(async (id) => await User.findById(id));
//   this.guides = await Promise.all(guidesPromises);
//   next();
// });
// query MiddleWare
tourSchema
  .pre(/^find/, function (next) {
    // all strings start with find
    this.find({ secretTour: { $ne: true } });
    next();
  });
tourSchema.pre(/^find/, function (next) {
  // all strings start with find
  this.populate({
    path: 'guides',
    select: '-__v',
  });
  next();
});

// aggregate
// tourSchema.pre('aggregate', function (next) {
//   this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
//   next();
// });
// tourSchema.pre('findOne', function (next) {
//   this.findOne({ secretTour: { $ne: true } });
//   next();
// });
const Tour = mongoose.model('Tour', tourSchema);

/*
 *** exports objects we return a functionality not code all code run here then
 return the work of it
 */
module.exports = Tour;
// "The Northern Lights",
