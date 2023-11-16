const transactionService = require("../services/transactions.service");

const getAllTransactions = async (req, res) => {
  const { phoneNumber } = req.body;
  const response = await transactionService.getAllTransactions(phoneNumber || null);

  if (response.success) {
    res.json(response.transaction);
  } else {
    res.status(500).json({
      message: "Erreur lors de la récupération de la conversation",
      error: response.error,
    });
  }
};

const addTransaction = async (req, res) => {
    const response = await transactionService.addTransaction(req.body);
  
    if (response.success) {
      res.json(response);
    } else {
      res.status(500).json({
        message: "Erreur lors l'ajout de la conversation",
        error: response,
      });
    }
  };

module.exports = {
    getAllTransactions,
    addTransaction
};
