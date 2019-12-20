const mongoose = require('mongoose');
const dotenv = require('dotenv');

process.on('uncaughtException', err => {
  console.log('Uncaught Exception, Shutting Down ...');
  console.log(err);
  process.exit(1); //0 is for success and 1 is for uncaught exceptions
});

dotenv.config({ path: './config.env' });

const app = require('./app');

const DB = process.env.DATABASE;

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: true
  })
  .then(() => {});

const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log(`app running on port ${port}...`);
});

process.on('unhandledRejection', err => {
  console.log('Unhandled Rejection, Shutting Down ...');
  console.log(err);
  server.close(() => {
    process.exit(1); //0 is for success and 1 is for uncaught exceptions
  });
});
