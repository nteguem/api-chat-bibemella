const TotalTransactions = require("../models/totaltransaction.model");

async function getAll() {
  try {
    const totalAmount = await TotalTransactions
      .find();

    return { success: true, totalAmount };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

module.exports = {
  getAll
};
