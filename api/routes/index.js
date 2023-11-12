// Import the 'express' module to create an instance of the router.
const express = require('express');
const router = express.Router();

// Import route modules with updated filenames.
const { setupPaiementRoutes } = require('./paiement.route');
const { setupSubscriptionRoutes } = require('./subscription.route');
const { setupUserRoutes } = require('./user.route');
const { setupProductRoutes } = require('./product.route');


/* GET home page. */
// Define a route for the home page ('/') that renders the 'index' template with the title 'Bibemella'.
router.get('/', function(req, res, next) {
  res.json({ title: 'chatbot Bibemella' });
});

/**
 * Function to set up all the app routes and connect them to their corresponding route modules.
 * @returns {express.Router} - The configured router instance.
 */
const setupAppRoutes = (client) => {
  const app = router;
  // Set up the predict routes and link them to the corresponding route module.
  setupPaiementRoutes(app, client);
  setupUserRoutes(app);
  setupSubscriptionRoutes(app);
  setupProductRoutes(app);
  return app;
}

// Export the 'setupAppRoutes' function to be used in other files.
module.exports = setupAppRoutes;
