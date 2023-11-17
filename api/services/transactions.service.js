const Transactions = require("../models/transactions.model");

async function getAllTransactions(phoneNumber) {
  try {
    const query = phoneNumber ? { userNumber: phoneNumber } : {};
    const transactionsWithUsers = await Transactions.aggregate([
      {
        $match: query, // Your match condition for Transactions
      },
      {
        $lookup: {
          from: "accounts", // The name of the User collection
          localField: "userNumber", // Field from Transactions collection
          foreignField: "phoneNumber", // Field from User collection
          as: "userData", // The name of the new field that will contain the matched user data
        },
      },
      {
        $unwind: "$userData", // Unwind the array created by $lookup
      },
      {
        $project: {
          'userData.name': 1, // Include only the 'name' field from 'userData'
          operator: 1,
          transactionId: 1,
          status: 1,
          amount: 1,
          transactionNumber: 1,
          userNumber: 1
        },
      },
    ]);

    return { success: true, transaction: transactionsWithUsers };
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

async function getTotalSuccessAmount() {
  try {
    const totalSuccessAmount = await Transactions
      .find({ status: 'SUCCESS' }) // Filtrer par statut 'SUCCESS'
      .select('amount'); // Sélectionner seulement le champ 'amount'

    const totalAmount = totalSuccessAmount.reduce((sum, transaction) => sum + transaction.amount, 0);

    return { success: true, totalAmount };
  } catch (error) {
    return { success: false, error: error.message };
  }
}



module.exports = {
  getAllTransactions,
  addTransaction,
  getTotalSuccessAmount
};
