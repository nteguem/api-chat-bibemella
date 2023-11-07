const express = require('express');
const router = express.Router();
const teachingHandler = require('../controllers/teaching.controller');

/**
 * Set up the Teaching routes and link them to the corresponding controller functions.
 * @param {express.Application} app - The Express application.
 */
const setupTeachingRoutes = (app) => {
  // Mount the 'router' to handle routes with the base path '/subscription'.
  app.use("/teaching", router);
  router.post('/create-teaching', teachingHandler.createTeaching);
  router.get('/all-teachings', teachingHandler.getAllTeachings); 
  router.put('/update-teaching/:teachingId', teachingHandler.updateTeachings);
  router.delete('/delete-teaching/:teachingId', teachingHandler.deleteTeaching);
  router.post('/add-teaching', teachingHandler.addTeachingToTeaching);
};

module.exports = { setupTeachingRoutes }; 
