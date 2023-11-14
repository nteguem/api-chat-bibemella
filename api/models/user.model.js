require('dotenv').config(); // Load environment variables from the .env file
const mongoose = require('mongoose');

const itemTypes = ['service', 'product', 'welness', 'chatgpt'];

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phoneNumber: { type: String, required: true, unique: true },
  password: { type: String, required: true},
  username_ejara: { type: String},
  engagementLevel:{type: Number},
  subscriptions: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'productservices' },
    subscriptionDate: { type: Date, default: Date.now },
    expirationDate: { type: Date }, //pour service et produit
    isOption: { type: Boolean, default: false}, //pour service et chatgpt
    optionId: { type: String }, //pour un sous service et forfait chatgpt
    productType: { type: String, required: true, enum: itemTypes, default: 'service' },
    transaction_id: { type: String, required: true },
    operator: { type: String, required: true },
    tokens: { type: Number } //pour chatgpt uniquement
  }],
});


const User = mongoose.model('accounts', userSchema);

module.exports = User;
