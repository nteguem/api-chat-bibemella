require('dotenv').config(); // Load environment variables from the .env file
const mongoose = require('mongoose');

const itemTypes = ['service', 'product'];

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phoneNumber: { type: String, required: true, unique: true },
  password: { type: String, required: true},
  username_ejara: { type: String},
  engagementLevel:{type: Number}, 
  subscriptions: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'productservices' },
    subscriptionDate: { type: Date, default: Date.now },
    expirationDate: { type: Date },
    isOption: { type: Boolean, default: false},
    optionId: { type: String },
    productType: { type: String, required: true, enum: itemTypes },
  }],
});


const User = mongoose.model('accounts', userSchema);

module.exports = User;
