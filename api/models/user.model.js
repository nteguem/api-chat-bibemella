require('dotenv').config(); // Load environment variables from the .env file
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phoneNumber: { type: String, required: true, unique: true },
  password: { type: String, required: true},
  username_ejara: { type: String},
  engagementLevel:{type: Number}, 
  subscriptions: [{
    subscription: { type: mongoose.Schema.Types.ObjectId, ref: 'Subscription' },
    subscriptionDate: { type: Date, default: Date.now },
    expirationDate: { type: Date },
  }],
});


const User = mongoose.model('accounts', userSchema);

module.exports = User;
