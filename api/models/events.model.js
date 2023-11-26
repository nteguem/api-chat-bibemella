const mongoose = require("mongoose");
const { Schema } = mongoose;

const eventSchema = new Schema({
  name: { type: String, required: true },
  date: { type: Date, required: true },
  time: { type: String, required: true },
  place: { type: String, required: true },
  description: { type: String },
  pack: [{ type: Schema.Types.ObjectId, ref: "productservices", required: true }],
  previewImage: { type: String },
  gallery: [{ type: String }],
});

const Event = mongoose.model("events", eventSchema);

module.exports = Event;
