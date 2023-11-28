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
  router.post('/create-service', productHanlder.createService);
  router.post('/create-product', productHanlder.createProduct);
  router.get('/all-Products', productHanlder.getAllProducts); 
  router.post('/add-product-to-user', productHanlder.addProductToUser);
  router.get('/user-subscriptions/:phoneNumber', productHanlder.getAllSubscriptionsUser); 
  router.get('/active-subscribers', productHanlder.getActiveSubscribers );
  router.delete('/delete/:id', productHanlder.deleteProductService );
  router.put('/update-service/:id', productHanlder.updateService );
  router.put('/update-product/:id', productHanlder.updateProduct );
};

module.exports = { setupProductRoutes };
