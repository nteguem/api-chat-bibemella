const express = require('express');
const router = express.Router();
const productHanlder = require('../controllers/product.controller');

/**
 * Set up the Product routes and link them to the corresponding controller functions.
 * @param {express.Application} app - The Express application.
 */
const setupProductRoutes = (app) => {
  // Mount the 'router' to handle routes with the base path '/Product'.
  app.use("/product", router);
  router.post('/create-product', productHanlder.createProductService);
  router.get('/all-Products', productHanlder.getAllProducts); 
};

module.exports = { setupProductRoutes };