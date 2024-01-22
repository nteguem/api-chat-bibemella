const TotalTransactions = require("../models/totaltransaction.model");
const Events = require("../models/events.model");
const { ProductService } = require("../models/product.model");
const User = require("../models/user.model");
const Transactions = require("../models/transactions.model");

async function getAll(phoneNumber) {
  let query = phoneNumber ? { phoneNumber } : {};
  try {
    // Récupérer le total des transactions
    const totalAmount = await TotalTransactions.findOne(); 

    if (!totalAmount) {
      throw new Error("Aucune transaction totale trouvée");
    }

    // Récupérer le total des événements
    const totalEvent = await Events.countDocuments({});

    // Récupérer le total des produits/services
    const totalProductService = await ProductService.countDocuments({});

    // Récupérer le total des utilisateurs
    const totalUsers = await User.countDocuments(query);
    
    // Récupérer les niveaux d'engagement
    const engagementLevels = await User.find({}, { engagementLevel: 1, _id: 0 });

    // Calculer la somme des niveaux d'engagement
    const totalEngagementLevel = engagementLevels.reduce((total, user) => total + (user.engagementLevel || 0), 0);

    // Récupérer les transactions mensuelles
    const transactions = await Transactions.find();

    // Initialiser un objet pour stocker les totaux par mois
    const monthlyTotals = {};

    // Parcourir les transactions pour calculer les totaux par mois
    transactions.forEach((transaction) => {
      const date = new Date(transaction.createdAt);
      const monthYearKey = `${date.getMonth() + 1}-${date.getFullYear()}`; // Format 'mois-année'
      const amount = transaction.amount;

      if (!monthlyTotals[monthYearKey]) {
        monthlyTotals[monthYearKey] = 0;
      }

      monthlyTotals[monthYearKey] += amount;
    });

    // Formater les données mensuelles
    const monthlyData = Object.entries(monthlyTotals).reduce((acc, [monthYear, totalAmount]) => {
      acc[monthYear] = { totalAmount };
      return acc;
    }, {});

    // Retourner toutes les statistiques
    const stats = {
      totalAmount: totalAmount.number,
      totalUsers,
      totalEvent,
      totalProductService,
      totalEngagementLevel,
      monthlyData,
    };

    return { success: true, stats };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

module.exports = {
  getAll,
};
