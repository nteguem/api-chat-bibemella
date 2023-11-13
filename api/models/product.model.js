const mongoose = require("mongoose");

const itemTypes = ['service', 'product', 'welness'];

// Subservice schema (nested within the product/service schema)
const subserviceSchema = new mongoose.Schema({
  name: { type: String },
  price: { type: Number },
  durationInDay: {type: Number },
  category: { type: String }
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
  durationInDay: {type: Number, default: 0 }, // Only for type: service... if hasSub is false. then it should be required
  subservices: [subserviceSchema], // Array of subservices
});

// Create models
const ProductService = mongoose.model("productservices", productServiceSchema);
// Export models
module.exports = {
  ProductService,
};
