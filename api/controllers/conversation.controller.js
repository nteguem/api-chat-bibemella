const conversationService = require("../services/conversation.service");

const getAllConversations = async (req, res) => {
  const { phoneNumber } = req.body;
  const response = await conversationService.getAllConversations(phoneNumber);

  if (response.success) {
    res.json(response.conversation);
  } else {
    res.status(500).json({
      message: "Erreur lors de la récupération de la conversation",
      error: response.error,
    });
  }
};

const addConversation = async (req, res) => {
    const { phoneNumber } = req.body;
    const response = await conversationService.addMessageToConversation(phoneNumber, req.body, 50);
  
    if (response.success) {
      res.json(response);
    } else {
      res.status(500).json({
        message: "Erreur lors l'ajout de la conversation",
        error: response,
      });
    }
  };

module.exports = {
    getAllConversations,
    addConversation
};
