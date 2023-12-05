const transactionService = require("../services/transactions.service");
const TotalTransactionsService = require("../services/totalTransaction.service");

const getAllTransactions = async (req, res) => {
  const { phoneNumber } = req.body;
  const page = req.query.page;
  const limit = req.query.limit ? parseInt(req.query.limit) : 10;
  const response = await transactionService.getAllTransactions(phoneNumber, page, limit || null);

  if (response.success) {
    res.json(response.transaction);
  } else {
    res.status(500).json({
      message: "Erreur lors de la récupération de la transaction",
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

const addAmountToTransaction = async (req, res) => {
  const response = await TotalTransactionsService.addAmountToTotal(req.body);

  if (response.success) {
    res.json({ sucess: true, totalAmount: response.totalAmount });
  } else {
    res.status(500).json({
      message: "Erreur lors de la récupération de la transaction",
      error: response.error,
    });
  }
};

const getTotalSuccessAmount = async (req, res) => {
  const response = await TotalTransactionsService.getTotalSuccessAmount();

  if (response.success) {
    res.json({ totalAmount: response.totalAmount });
  } else {
    res.status(500).json({
      message: "Erreur lors de la récupération de la transaction",
      error: response.error,
    });
  }
};




module.exports = { 
  getAllTransactions,
  addTransaction,
  addAmountToTransaction,
  getTotalSuccessAmount
};
