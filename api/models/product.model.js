const mongoose = require("mongoose");

const itemTypes = ['service', 'product'];

// Subservice schema (nested within the product/service schema)
const subserviceSchema = new mongoose.Schema({
  name: { type: String },
  price: { type: Number },
  durationInDay: {type: Number }
});

// Product/Service schema
const productServiceSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  description: { type: String },
  price: { type: Number, required: true },
  type: { type: String, required: true, enum: itemTypes },
  image: { type: String },
  advantage: { type: String },
  link: { type: String },
  hasSub: {type: Boolean, required: true, default: false},
  subservices: [subserviceSchema], // Array of subservices
});

// Create models
const ProductService = mongoose.model("productservices", productServiceSchema);
// Export models
module.exports = {
  ProductService,
};