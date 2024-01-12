const TotalTransactions = require("../models/totaltransaction.model");
const Events = require("../models/events.model");
const { ProductService } = require("../models/product.model");
const User = require("../models/user.model");
const Conversation = require("../models/conversation.model");

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

module.exports = {
  getAll
};
