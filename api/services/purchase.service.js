const Purchase = require('../models/purchase.model');
const User = require('../models/user.model');

async function createPurchase(purchaseData) {
  try {
    const newPurchase = new Purchase(purchaseData);
    await newPurchase.save();
    return { success: true, message: 'Achat créé avec succès' };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function getUserPurchases(phoneNumber) {
    try {
      const user = await User.findOne({ phoneNumber });
  
      if (!user) {
        return { success: false, message: 'Utilisateur non trouvé' };
      }
  
      const userPurchases = await Purchase.find({ user: user._id });
  
      return { success: true, purchases: userPurchases };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

async function updatePurchase(purchaseId, updatedData) {
  try {
    const updatedPurchase = await Purchase.findByIdAndUpdate(purchaseId, updatedData, { new: true });

    if (!updatedPurchase) {
      return { success: false, message: 'Achat non trouvé' };
    }

    return { success: true, purchase: updatedPurchase };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function deletePurchase(purchaseId) {
  try {
    const deletedPurchase = await Purchase.findByIdAndDelete(purchaseId);

    if (!deletedPurchase) {
      return { success: false, message: 'Achat non trouvé' };
    }

    return { success: true, message: 'Achat supprimé avec succès' };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

module.exports = {
  createPurchase,
  getUserPurchases,
  updatePurchase,
  deletePurchase,
};
