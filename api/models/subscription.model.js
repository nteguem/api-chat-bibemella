const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  name: { type: String, required: true,unique:true },
  durationInDays: { type: Number, required: true },
  price: { type: Number, required: true },
  description: { type: String, required: true },
});

const Subscription = mongoose.model('Subscription', subscriptionSchema);

module.exports = Subscription;
