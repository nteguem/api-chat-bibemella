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
        let filter = {
            // 'subscriptions.tokens': { $gt: 0 },
            'phoneNumber': {$eq: phoneNumber},
            // 'subscriptions.productType': {$eq: 'chatgpt'}
        };
        let user = await User.findOne(filter);
        if (user) {
            // Filter subscriptions based on the criteria
            const matchingSubscriptions = user.subscriptions.filter(subscription => (
              subscription.tokens > 0 && subscription.productType === 'chatgpt'
            ));
            if(matchingSubscriptions.length<=0){
                return { success: false, error: "Oups! votre credit d'access a l'assistant personnel est epuisé" };
            }
            console.log(matchingSubscriptions, 'matching subscriptions');
            let optionId = matchingSubscriptions[0].optionId;
            let userId = user._id;

            const updateResult = await User.updateOne(
                { _id: userId, 'subscriptions.optionId': optionId },
                { $inc: { 'subscriptions.$.tokens': -tokens } }
              );
          } else {
            console.log('User not found');
            return { success: false, message: "Cette utilisateur n'existe pas." };
          }
    }

    // conversation.messages.push({
    //   role: message.role,
    //   content: message.content,
    //   tokens: tokens
    // });

    // await conversation.save();

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
