const fs = require('fs');
const stripe = require('stripe')(process.env.STRIPE_SECRET);
const Tour = require('./../models/toursmodel.js');
const Factory = require('./../controllers/handleFactory.js');
const catchAsyncErrors = require('./../utls/catchAsyncError');
const AppError = require('./../utls/appError.js');
exports.getCheckoutSession = catchAsyncErrors(async (req, res, next) => {
  // 1)find tour
  const tour = await Tour.find(req.params.tourID);
  //2) create checkout sessions
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    success_url: `${req.protocol}://${req.get('host')}/`,
    cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
    customer_email: req.user.email,
    customer_reference_id: req.params.id,
    //info about items
    line_items: [
      {
        name: `${tour.name} tour`,
        description: tour.summery,
        amount: tour.price * 100,
        currency: 'usd',
        quantity: 1,
      },
    ],
  });
  //3) create session as response
  res.status(200).json({
    status: 'success',
    session,
  });
});
