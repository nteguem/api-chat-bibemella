const statService = require("../services/stats.service");

const getAll = async (req, res) => {
  const response = await statService.getAll();

  if (response.success) {
    res.json({stats: response.stats,  success: true});
  } else {
    res.status(500).json({
      message: "Erreur lors de la récupération des stats",
      error: response.error,
    });
  }
};

const getDailyTransactionData = async (req, res) => {
  const response = await statService.getDailyTransactionData(); // Utilisation de la nouvelle fonction

  if (response.success) {
    res.json({ dailyTransactionData: response.dailyTransactionData, success: true }); // Utilisation de la nouvelle propriété lineChartDataTotalSpent
  } else {
    res.status(500).json({
      message: "Erreur lors de la récupération des stats mensuelles",
      error: response.error,
    });
  }
};

module.exports = { 
  getAll,
  getDailyTransactionData
};
