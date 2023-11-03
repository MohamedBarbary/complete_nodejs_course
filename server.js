/*
   1- first mongooes is high level dba from mongo 
   2- dotenv help us require config files 
*/

const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: './config.env' });
const app = require('./app');
// catch code errors
process.on('unhandledRejection', (err) => {
  console.log(err.name, err.message);
  console.log('Unhandle exception ,.. We Will Shunt down');
  // direct close
  process.exit(1);
});

const DBA = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);
mongoose
  .connect('mongodb://127.0.0.1:27017/natours', {
    // .connect(DBA, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
  })
  .then((con) => {
    console.log('DB connection is successes');
  });
/*
 listen to start our server
*/
const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`we are in port ${port} `);
});

// catch async erros unhandled one
process.on('unhandledRejection', (err) => {
  console.log(err.name, err.message);
  console.log('Unhandle Rejection ,.. We Will Shunt down');
  server.close(() => process.exit(1));
});
