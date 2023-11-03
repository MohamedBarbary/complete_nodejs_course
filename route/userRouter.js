const express = require('express');
const userController = require('./../controllers/userController');
const authController = require('./../controllers/authController');
const router = express.Router();

router.post('/forgotPassword', authController.forgotPassword);
router.patch(
  '/updatePassword',
  authController.protectRoutes,
  authController.updatePassword
);
router.patch('/resetPassword/:token', authController.resetPassword);
router.post('/signup', authController.signUp);
router.post('/login', authController.login);

// Router.use(auth)  runs before get(me) and all under it
// this now middleWare in stack
router.use(authController.protectRoutes);
router.patch(
  '/updateMe',
  userController.uploadUserPhoto,
  userController.resizeUserPhoto,
  userController.updateMe
);
router.delete('/deleteMe', userController.deleteMe);
router.get('/me', userController.getMe, userController.getUser);
router.use(authController.restrictTo('admin'));

router
  .route('/')
  .get(userController.getAllUsers)
  .post(userController.createUser);
router
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);
/*
 *** exports objects we return a functionality not code all code run here then
 return the work of it
 */
module.exports = router;
