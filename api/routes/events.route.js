const express = require('express');
const router = express.Router();
const eventsHandle = require('../controllers/events.controller');

/**
 * Set up the Product routes and link them to the corresponding controller functions.
 * @param {express.Application} app - The Express application.
 */
const setupEventsRoutes = (app) => {
  // Mount the 'router' to handle routes with the base path '/Product'.
  app.use("/events", router);
  router.post('/create-event', eventsHandle.createEvent);
  router.get('/all-events', eventsHandle.getAllEvents);
  router.put('/update/:id', eventsHandle.updateEvent);
};

module.exports = { setupEventsRoutes };
