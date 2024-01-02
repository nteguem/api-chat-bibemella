const express = require("express");
const router = express.Router();
const eventsHandle = require("../controllers/stats.controller");

/**
 * Set up the Product routes and link them to the corresponding controller functions.
 * @param {express.Application} app - The Express application.
 */
const setupStatsRoutes = (app) => {
  // Mount the 'router' to handle routes with the base path '/Product'.
  app.use("/statistiques", router);
  router.get("/", eventsHandle.getAll);
};

module.exports = { setupStatsRoutes };
