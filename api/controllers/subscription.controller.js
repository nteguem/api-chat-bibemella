const subscriptionService = require('../services/subscription.service');

const createSubscription = async (req, res) => {
    const subscriptionData = req.body;
    const response = await subscriptionService.createSubscription(subscriptionData);
    
    if (response.success) {
      res.json({ message: response.message });
    } else {
      res.status(500).json({ message: 'Erreur lors de la création du forfait', error: response.error });
    }
  };
  
  const getAllSubscriptions = async (req, res) => {
    const {type} =req.body
    const response = await subscriptionService.getAllSubscriptions(type);
    
    if (response.success) {
      res.json(response.subscriptions);
    } else {
      res.status(500).json({ message: 'Erreur lors de la récupération des forfaits', error: response.error });
    }
  };
  
  const updateSubscription = async (req, res) => {
    const subscriptionId = req.params.subscriptionId;
    const updatedData = req.body;
    const response = await subscriptionService.updateSubscription(subscriptionId, updatedData);
    
    if (response.success) {
      res.json(response.subscription);
    } else {
      res.status(404).json({ message: response.message });
    }
  };
  
  const deleteSubscription = async (req, res) => {
    const subscriptionId = req.params.subscriptionId;
    const response = await subscriptionService.deleteSubscription(subscriptionId);
    
    if (response.success) {
      res.json({ message: response.message });
    } else {
      res.status(404).json({ message: response.message });
    }
  };

const getActiveSubscribers = async (req, res) => {
  const {name} = req.body;
    const response = await subscriptionService.findActiveSubscribers(name);
    if (response.success) {
        res.json(response.data);
    } else {
        res.status(500).json({ message: 'Erreur lors de la récupération des abonnés actifs', error: response.error });
    }
};

// const checkActiveSubscription = async (req, res) => {
//     const phoneNumber = req.params.phoneNumber;
//     const response = await subscriptionService.hasActiveSubscription(phoneNumber);

//     if (response.success) {
//         res.json({ hasActiveSubscription: response.hasActiveSubscription });
//     } else {
//         res.status(500).json({ message: 'Erreur lors de la vérification de l\'abonnement actif', error: response.error });
//     }
// };

const getAllSubscriptionsUser = async (req, res) => {
    const phoneNumber = req.params.phoneNumber;
    const response = await subscriptionService.getAllUserSubscriptions(phoneNumber);

    if (response.success) {
        res.json(response);
    } else {
        res.status(500).json({ message: 'Erreur lors de la récupération des souscriptions de l\'utilisateur', error: response.error });
    }
};

  const addSubscriptionToUser = async (req, res) => { 
    const { phoneNumber, subscriptionName, expirationDate } = req.body;
    const addSubscription = { subscriptionName, expirationDate};
    const response = await subscriptionService.addSubscriptionToUser(phoneNumber,addSubscription);
    
    if (response.success) {
      res.json({ message: response.message, subscription: response.subscription });
    } else {
      res.status(500).json({ message: 'Erreur lors de l\'ajout de la souscription', error: response.error });
    }
  };

module.exports = { 
    getActiveSubscribers,
    getAllSubscriptionsUser,
    // checkActiveSubscription,
    addSubscriptionToUser,
    createSubscription,
    getAllSubscriptions,
    updateSubscription,
    deleteSubscription
};
