const User = require('../models/user.model');
const Subscription = require('../models/subscription.model');


async function createSubscription(subscriptionData) {
  try {
    const newSubscription = new Subscription(subscriptionData);
    await newSubscription.save();
    return { success: true, message: 'Forfait créé avec succès' };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function getAllSubscriptions() {
  try {
    const subscriptions = await Subscription.find();
    return { success: true, subscriptions };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function updateSubscription(subscriptionId, updatedData) {
  try {
    const updatedSubscription = await Subscription.findByIdAndUpdate(subscriptionId, updatedData, { new: true });
    
    if (!updatedSubscription) {
      return { success: false, message: 'Forfait non trouvé' };
    }

    return { success: true, subscription: updatedSubscription };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function deleteSubscription(subscriptionId) {
  try {
    const deletedSubscription = await Subscription.findByIdAndDelete(subscriptionId);
    
    if (!deletedSubscription) {
      return { success: false, message: 'Forfait non trouvé' };
    }

    return { success: true, message: 'Forfait supprimé avec succès' };
  } catch (error) {
    return { success: false, error: error.message };
  }
}


async function findActiveSubscribers() {
  try {
   // const activeSubscribers = await User.find({ 'subscriptions.expirationDate': { $gt: new Date() } }).select('-password').populate('subscriptions.subscription');
   const activeSubscribers = await User.find({ 'subscriptions.expirationDate': { $gt: new Date() } }).select('phoneNumber');
   return { success: true, data: activeSubscribers };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function hasActiveSubscription(phoneNumber) {
    try {
      const user = await User.findOne({ phoneNumber, 'subscriptions.expirationDate': { $gt: new Date() } });
      return { success: true, hasActiveSubscription: !!user };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  async function getAllSubscriptionsUser(phoneNumber) {
    try {
      const user = await User.findOne({ phoneNumber }).populate('subscriptions.subscription');
      
      if (!user) {
        return { success: false, message: 'Utilisateur non trouvé' };
      }
  
      return { success: true, subscriptions: user.subscriptions };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }


  async function addSubscriptionToUser(phoneNumber, subscriptionName, subscriptionDate, expirationDate) {
    try {
      const user = await User.findOne({ phoneNumber }); // Recherche de l'utilisateur par numéro de téléphone
      const subscription = await Subscription.findOne({ name: subscriptionName }); // Recherche du forfait par nom
  
      if (!user || !subscription) {
        return { success: false, message: 'Utilisateur ou forfait non trouvé' };
      }
  
      user.subscriptions.push({
        subscription: subscription._id,
        subscriptionDate,
        expirationDate,
      });
  
      await user.save();
  
      // Récupérer l'objet complet de l'abonnement depuis la base de données
      const addedSubscription = await Subscription.findById(subscription._id);
  
      return { success: true, message: 'Souscription ajoutée avec succès', subscription: addedSubscription };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }



module.exports = {
  createSubscription,
  getAllSubscriptions,
  updateSubscription,
  deleteSubscription,
  findActiveSubscribers,
  getAllSubscriptionsUser,
  hasActiveSubscription,
  addSubscriptionToUser,
};
