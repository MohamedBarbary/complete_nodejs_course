const catchAsyncErrors = require('./../utls/catchAsyncError');
const AppError = require('./../utls/appError');
const apiFeatures = require('./../utls/apiFeatures.js');

exports.getAll = (Model) =>
  catchAsyncErrors(async (req, res, next) => {
    // this to lines allow nested routes when getting rev
    let filter = {};
    if (req.params.tourId) filter = { tour: req.params.tourId };
    //await tours
    const features = new apiFeatures(Model.find(filter), req.query)
      .filter()
      .sort()
      .limit()
      .pagination();
    const doc = await features.query;
    res.status(200).json({
      status: 'success',
      results: doc.length,
      data: {
        data: doc,
      },
    });
  });
exports.deleteOne = (Model) =>
  catchAsyncErrors(async (req, res, next) => {
    const document = await Model.findByIdAndDelete(req.params.id);
    if (!document) {
      new AppError('no document found with this data');
    }
    res.status(204).json({
      status: 'success',
      document,
    });
  });
exports.getOne = (Model, popOptions) =>
  catchAsyncErrors(async (req, res, next) => {
    let query = Model.findById(req.params.id);
    if (popOptions) query.populate(popOptions);
    const doc = await query;
    console.log(doc);
    if (!doc) {
      return next(new AppError('no doc found with this id'), 404);
    }
    res.status(200).json({
      status: 'success',
      data: {
        doc,
      },
    });
  });

exports.createOne = (Model) =>
  catchAsyncErrors(async (req, res, next) => {
    const newDocument = await Model.create(req.body);
    res.status(201).json({
      status: 'success',
      data: {
        document: newDocument,
      },
    });
  });

// object of options so important
exports.updateOne = (Model) =>
  catchAsyncErrors(async (req, res, next) => {
    const document = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!document) {
      return next(new AppError('no found document with this id'), 404);
    }
    res.status(200).json({
      status: 'success',
      data: {
        document,
      },
    });
  });
//////////////////
// reference
