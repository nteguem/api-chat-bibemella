const express = require('express');
const router = express.Router();
const productHandler = require('../controllers/product.controller');

/**
 * Set up the Product routes and link them to the corresponding controller functions.
 * @param {express.Application} app - The Express application.
 */
const setupProductRoutes = (app) => {
  // Mount the 'router' to handle routes with the base path '/subscription'.
  app.use("/product", router);
  router.post('/create-product', productHandler.createProduct);
  router.get('/all-products', productHandler.getAllProduct); 
  router.put('/update-product/:productId', productHandler.updateProducts);
  router.delete('/delete-product/:productId', productHandler.deleteProduct);
};

module.exports = { setupProductRoutes }; 
