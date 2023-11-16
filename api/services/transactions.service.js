const Transactions = require("../models/transactions.model");

async function getAllTransactions(phoneNumber) {
  try {
    const query = phoneNumber ? { phoneNumber } : {};
    const transaction = await Transactions.find(query);
    return { success: true, transaction };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function addTransaction(data) {
  try {
    const transaction = new Transactions({
      operator: data.operator,
      transactionId: data.transactionId,
      status: data.status,
      amount: data.price,
      transactionNumber: data.transactionNumber,
      userNumber: data.userPhoneNumber,
    });

    await transaction.save();

    return {
      success: true,
      message: "Message ajouté avec succès",
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

module.exports = {
  getAllTransactions,
  addTransaction,
};
