const User = require('../models/user.model');
const Subscription = require('../models/subscription.model'); // Utilisation du modèle Subscription

async function createSubscription(subscriptionData) {
  try {
    const newSubscription = new Subscription(subscriptionData);
    await newSubscription.save();
    return { success: true, message: 'Souscription créée avec succès' };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function getAllSubscriptions(type) {
  try {
    const query = type ? { type } : {};
    const subscriptions = await Subscription.find(query);
    return { success: true, subscriptions };
  } catch (error) {
    return { success: false, error: error.message };
  }
}


async function updateSubscription(subscriptionId, updatedData) {
  try {
    const updatedSubscription = await Subscription.findByIdAndUpdate(subscriptionId, updatedData, { new: true });

    if (!updatedSubscription) {
      return { success: false, message: 'Souscription non trouvée' };
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
      return { success: false, message: 'Souscription non trouvée' };
    }

    return { success: true, message: 'Souscription supprimée avec succès' };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function findActiveSubscribers(name) {
  try {
    const query = {
      'subscriptions.subscription.name': name,
      'subscriptions.expirationDate': { $exists: true },
    };

    const activeSubscribers = await User.find(query).select('phoneNumber');
    
    return { success: true, data: activeSubscribers };
  } catch (error) {
    return { success: false, error: error.message };
  }
}


async function getAllUserSubscriptions(phoneNumber) {
  try {
    const user = await User.findOne({ phoneNumber }).populate('subscriptions.subscription'); // Associez les souscriptions à l'utilisateur

    if (!user) {
      return { success: false, message: 'Utilisateur non trouvé' };
    }

    const activeServices = user.subscriptions.filter(sub => sub.expirationDate > new Date());
    const products = user.subscriptions.filter(sub => !sub.expirationDate);

    return { success: true, services: activeServices, products: products };
  } catch (error) {
    return { success: false, error: error.message };
  }
}


async function addSubscriptionToUser(phoneNumber, addSubscription) {
  try {
    const user = await User.findOne({ phoneNumber });
    const subscription = await Subscription.findOne({ name: addSubscription.subscriptionName });

    if (!user || !subscription) {
      return { success: false, message: 'Utilisateur ou souscription non trouvé' };
    }

    user.subscriptions.push({
      subscription: subscription._id,
      ...addSubscription
    });

    await user.save();

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
  getAllUserSubscriptions,
  addSubscriptionToUser,
};
