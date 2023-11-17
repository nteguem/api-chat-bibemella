const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  role: { type: String, required: true, enum: ['system', 'user', 'assistant'] },
  content: { type: String, required: true },
  tokens: { type: Number }
});

const conversationSchema = new mongoose.Schema({
  messages: [messageSchema],
  phoneNumber: { type: String, required: true, unique: true },
  
});

const Conversation = mongoose.model('conversation', conversationSchema);

module.exports = Conversation;
