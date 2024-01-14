const mongoose = require('mongoose');
const localDB = process.env.URL_DB_LOCAL;
const liveDB = process.env.URL_DB_LIVE;

const dbConnect = async () => {
  try {
    // Connection to mongodb
mongoose.connect(localDB);
mongoose.Promise = global.Promise
let db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error'));
db.once('open', function() {
    console.log('Connected to mongodb');
})
  } catch (error) {
    console.error('MongoDB connection error :', error);
    throw error;
  }
};

module.exports = dbConnect;
