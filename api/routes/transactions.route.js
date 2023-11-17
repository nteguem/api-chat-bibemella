const express = require('express');
const router = express.Router();
const transactionHandle = require('../controllers/transactions.controller');

/**
 * Set up the Product routes and link them to the corresponding controller functions.
 * @param {express.Application} app - The Express application.
 */
const setupTransactionsRoutes = (app) => {
  // Mount the 'router' to handle routes with the base path '/Product'.
  app.use("/transactions", router);
  router.get('/all-transactions', transactionHandle.getAllTransactions); 
  router.post('/add-amount-transaction', transactionHandle.addAmountToTransaction);
  router.post('/add-transaction', transactionHandle.addTransaction); 
  router.get('/get-total-transactions-amount', transactionHandle.getTotalSuccessAmount); 
};

module.exports = { setupTransactionsRoutes };
