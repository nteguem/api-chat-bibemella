const TotalTransactions = require("../models/totaltransaction.model");
const Events = require("../models/events.model");
const { ProductService } = require("../models/product.model");
const User = require("../models/user.model");
const Transactions = require("../models/transactions.model");

async function getAll(phoneNumber) {
  let query = phoneNumber ? { phoneNumber } : {};
  try {
    const totalAmount = await TotalTransactions.findOne(); 

    if (!totalAmount) {
      throw new Error("Aucune transaction totale trouvée");
    }

    const totalEvent = await Events.countDocuments({});
    const totalProductService = await ProductService.countDocuments({});
    const totalUsers = await User.countDocuments(query);
    
    const engagementLevels = await User.find({}, { engagementLevel: 1, _id: 0 }); // Récupérer uniquement les valeurs d'engagementLevel

    // Calculer la somme des engagementLevel
    const totalEngagementLevel = engagementLevels.reduce((total, user) => total + (user.engagementLevel || 0), 0);

    const stats = {
      totalAmount: totalAmount.number,
      totalUsers: totalUsers,
      totalEvent: totalEvent,
      totalProductService: totalProductService,
      totalEngagementLevel: totalEngagementLevel
    };

    return { success: true, stats };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function getDailyTransactionData() {
  try {
    // Récupérer toutes les transactions
    const transactions = await Transactions.find();

    // Initialiser un objet pour stocker les totaux par jour
    const dailyTotals = {};

    // Parcourir les transactions pour calculer les totaux par jour
    transactions.forEach((transaction) => {
      const date = new Date(transaction.createdAt); // Supposons que la date est stockée dans la propriété 'date'
      const day = date.getDate();
      const amount = transaction.amount;

      if (!dailyTotals[day]) {
        dailyTotals[day] = 0;
      }

      dailyTotals[day] += amount;
    });

    // Convertir les totaux par jour en tableau avec la structure attendue par le frontend
    const lineChartDataTotalSpent = Object.keys(dailyTotals).map((day) => ({
      name: `Day ${day}`, // Nom à personnaliser
      data: Array.from({ length: 31 }, (_, i) => (dailyTotals[i + 1] || 0)),
    }));

    return { success: true, lineChartDataTotalSpent };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

module.exports = {
  getAll,
  getDailyTransactionData
};
