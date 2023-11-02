const express = require('express');
const router = express.Router();
const paymentHandler = require('../controllers/paiement.controller');

/**
 * Set up the paiement routes and link them to the corresponding controller functions.
 * @param {express.Application} app - The Express application.
 */
const setupPaiementRoutes = (app, client) => {
    // Mount the 'router' to handle routes with the base path '/paiement'.
    app.use("/paiement", router);
  
    router.post("/notification", (req, res) => {
      paymentHandler.handlePaymentNotification(req, res, client); 
     });

  };
  
  module.exports = { setupPaiementRoutes };
