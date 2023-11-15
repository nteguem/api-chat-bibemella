const express = require('express');
const router = express.Router();
const conversationHandle = require('../controllers/conversation.controller');

/**
 * Set up the Product routes and link them to the corresponding controller functions.
 * @param {express.Application} app - The Express application.
 */
const setupConversationRoutes = (app) => {
  // Mount the 'router' to handle routes with the base path '/Product'.
  app.use("/conversation", router);
  router.get('/all-conversation', conversationHandle.getAllConversations); 
  router.post('/add-conversation', conversationHandle.addConversation); 
};

module.exports = { setupConversationRoutes };
