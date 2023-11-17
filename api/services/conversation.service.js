const Conversation = require("../models/conversation.model"); // Utilisation du modèle Subscription
const User = require("../models/user.model");

async function getAllConversations(phoneNumber) {
  try {
    const query = phoneNumber ? { phoneNumber } : {};
    const conversation = await Conversation.find(query);
    return { success: true, conversation };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function addMessageToConversation(phoneNumber, message, tokens=0) {
  try {
    let conversation = await Conversation.findOne({ phoneNumber });

    if (!conversation) {
      conversation = new Conversation({
        phoneNumber: phoneNumber,
        messages: [{tokens: tokens, ...message}],
      });

      await conversation.save();

      return {
        success: true,
        message: "Nouvelle conversation créée avec succès",
        data: message,
      };
    }

    if(tokens > 0){
      const filter = {
        phoneNumber: phoneNumber,
        'subscriptions.tokens': { $gt: 0 },
        'subscriptions.productType': 'chatgpt'
      };
      
      const updateOperation = {
        $inc: { 'subscriptions.$.tokens': -1 }
      };
      
      const updateResult = await User.findOneAndUpdate(filter, updateOperation);
      
      if (updateResult) {
        // 
      } else {
        return { success: false, error: "Oups! Votre crédit d'accès à l'assistant personnel est épuisé" };
      }
    }

    conversation.messages.push({
      role: message.role,
      content: message.content,
      tokens: tokens
    });

    await conversation.save();

    return {
      success: true,
      message: "Message ajouté avec succès",
      data: message,
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

module.exports = {
  getAllConversations,
  addMessageToConversation,
};
