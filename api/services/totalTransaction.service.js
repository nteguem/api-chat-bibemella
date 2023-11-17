const TotalTransactions = require("../models/totaltransaction.model");

async function addAmountToTotal(data) {
  try {
    const filter = {}; // An empty filter to match any document
    const updateOperation = {
      $inc: { amount: data.price, number: 1 },
    };

    const options = {
      upsert: true, // Create the document if it doesn't exist
      new: true, // Return the modified document (new option requires MongoDB >= 4.0.0)
    };

    const updatedDocument = await TotalTransactions.findOneAndUpdate(
      filter,
      updateOperation,
      options
    );

    return {
      success: true,
      message: "Total des transactions mis ajour avec succès",
      totalAmount: updatedDocument
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function getTotalSuccessAmount() {
  try {
    const totalAmount = await TotalTransactions
      .find();

    return { success: true, totalAmount };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

module.exports = {
  addAmountToTotal,
  getTotalSuccessAmount
};
