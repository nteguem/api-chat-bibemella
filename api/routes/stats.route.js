const express = require("express");
const router = express.Router();
const statsHandle = require("../controllers/stats.controller");

/**
 * Set up the Product routes and link them to the corresponding controller functions.
 * @param {express.Application} app - The Express application.
 */
const setupStatsRoutes = (app) => {
  // Mount the 'router' to handle routes with the base path '/Product'.
  app.use("/statistiques", router);
  router.get("/", statsHandle.getAll);
};

module.exports = { setupStatsRoutes };
