const mongoose = require('mongoose');

const teachingSchema = new mongoose.Schema({
    type: { type: String, required: true, unique: true },
    name: [{
        name: { type: String, unique: true },
        price: { type: Number },
        durationInDay: { type: Number }
    }],
    price: { type: Number },
});

const Teaching = mongoose.model('Teaching', teachingSchema);

module.exports = Teaching;
