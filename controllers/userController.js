/*
 *** exports objects we return a functionality not code all code run here then
 return the work of it
 */
const User = require('./../models/userModel');
const Factory = require('./../controllers/handleFactory.js');
const catchAsyncErrors = require('./../utls/catchAsyncError');
const sharp = require('sharp');
//!!Important note we user multer to upload images from disk to db but we don't
// store it direct to db we store it in fileSystem then put name of image in db
const multer = require('multer');
const AppError = require('./../utls/appError');
// Multer Functions are MIDDLEWARES
// const multerStorage = multer.diskStorage({
//   // From
//   destination: (req, file, cb) => {
//     cb(null, 'public/img/users');
//   },
//   //To
//   filename: (req, file, cb) => {
//     const imageExtention = file.mimetype.split('/')[1];
//     cb(null, `user-${req.user.id}-${Date.now()}.${imageExtention}`); // Second argument is photo name i think we need to make it unique as possible
//   },
// });
// its best to store files in memory not at disk
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
exports.uploadUserPhoto = upload.single('photo');
exports.resizeUserPhoto = catchAsyncErrors(async (req, res, next) => {
  if (!req.file) return next();
  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;
  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({
      quality: 90,
    })
    .toFile(`public/img/users/${req.file.filename}`);
  next();
});
exports.getAllUsers = Factory.getAll(User);
const filterObj = function (obj, ...allowedFields) {
  const newObject = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) {
      newObject[el] = obj[el];
    }
  });
  return newObject;
};
exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};
exports.updateMe = catchAsyncErrors(async (req, res, next) => {
  console.log(req.file);
  console.log(req.body);
  // 1) error if user try to update password
  if (req.body.password || req.body.passwordConfirm) {
    return next(new AppError('you not allowed to change password here', 400));
  }
  // 2) update user document
  // select field may be contains role from user to admin so allow name and email only
  // /so we filter the wants that we don't need
  const filteredBody = filterObj(req.body, 'name', 'email');
  if (req.file) filteredBody.photo = req.file.filename;
  const updatedUser = await User.findById(req.user.id, filteredBody, {
    new: true,
    runValidator: true,
  });
  // ) send the response
  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser,
    },
  });
});
exports.deleteMe = catchAsyncErrors(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });
  res.status(204).json({
    status: 'success',
    data: null,
  });
  next();
});
exports.createUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'please use sign up to create new user ',
  });
};
exports.getUser = Factory.getOne(User);
exports.updateUser = Factory.updateOne(User);
exports.deleteUser = Factory.deleteOne(User);
