const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  sender: { type: String },
  notifications:[{
    type: { type: String },
    description: { type: String },
    date: { type: Date, default: Date.now }
  }],
});

const Notification = mongoose.model('notification', notificationSchema);

module.exports = Notification;
