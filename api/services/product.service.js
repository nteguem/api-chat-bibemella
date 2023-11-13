const User = require("../models/user.model");
const { ProductService } = require("../models/product.model"); // Utilisation du modèle Subscription

async function createProductService(productData) {
  try {
    const newProduct = new ProductService(productData);

    await newProduct.save();
    return { success: true, message: "produit créée avec succès" };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function getAllProducts(type) {
  try {
    const query = type ? { type } : {};
    const products = await ProductService.find(query);
    return { success: true, products };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function addProductToUser(phoneNumber, addSubscription) {
  try {
    console.log(addSubscription, "dkjf", phoneNumber);
    const user = await User.findOne({ phoneNumber });
    const product = await ProductService.findOne({
      _id: addSubscription.itemId,
    });

    if (!user || !product) {
      return {
        success: false,
        message: "Utilisateur ou souscription non trouvé",
      };
    }

    user.subscriptions.push({
      productId: addSubscription.itemId,
      expirationDate: addSubscription.expirationDate,
      isOption: addSubscription.hasSub,
      optionId: addSubscription?.selectedServiceOption?._id,
      productType: addSubscription.type,
    });

    await user.save();

    const addedSubscription = await ProductService.findById(product._id);

    return {
      success: true,
      message: "Souscription ajoutée avec succès",
      subscription: addedSubscription,
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// async function updateSubscription(subscriptionId, updatedData) {
//   try {
//     const updatedSubscription = await Subscription.findByIdAndUpdate(subscriptionId, updatedData, { new: true });

//     if (!updatedSubscription) {
//       return { success: false, message: 'Souscription non trouvée' };
//     }

//     return { success: true, subscription: updatedSubscription };
//   } catch (error) {
//     return { success: false, error: error.message };
//   }
// }

// async function deleteSubscription(subscriptionId) {
//   try {
//     const deletedSubscription = await Subscription.findByIdAndDelete(subscriptionId);

//     if (!deletedSubscription) {
//       return { success: false, message: 'Souscription non trouvée' };
//     }

//     return { success: true, message: 'Souscription supprimée avec succès' };
//   } catch (error) {
//     return { success: false, error: error.message };
//   }
// }

// async function findActiveSubscribers(name) {
//   try {
//     const query = {
//       'subscriptions.subscription.name': name,
//       'subscriptions.expirationDate': { $exists: true },
//     };

//     const activeSubscribers = await User.find(query).select('phoneNumber');

//     return { success: true, data: activeSubscribers };
//   } catch (error) {
//     return { success: false, error: error.message };
//   }
// }

async function findActiveSubscribers(isOption, productId, optionId) {
  try {
      const currentDate = new Date();
      let filter = {
          'subscriptions.expirationDate': { $gt: currentDate }
      };

      if (isOption) {
          filter['subscriptions.isOption'] = true;
          filter['subscriptions.productId'] = productId;
          filter['subscriptions.optionId'] = optionId;
      } else {
          filter['subscriptions.productId'] = productId;
      }

      const activeSubscribers = await User.find(filter)
          .populate('subscriptions.productId'); 

      return { success: true, activeSubscribers: activeSubscribers };
  } catch (error) {
      console.error("Erreur dans findActiveSubscribers:", error);
      return { success: false, error: "Erreur lors de la recherche des abonnés actifs" };
  }
}


async function getAllUserSubscriptions(phoneNumber, type = "all") {
  try {
    const user = await User.findOne({ phoneNumber }).populate(
      "subscriptions.productId"
    ); // Associez les souscriptions à l'utilisateur

    if (!user) {
      return { success: false, message: "Utilisateur non trouvé" };
    }

    const services = user.subscriptions.filter(
      (sub) => sub.productType === "service" && sub.expirationDate > new Date()
    );
    const products = user.subscriptions.filter(
      (sub) => sub.productType === "product"
    );

    //we transform the services here
    const transformedServices = services.map((service) => {
      if (service.isOption) {
        const subData = service.productId.subservices.find(
          (sub) => sub._id.toString() === service.optionId
        );



        return {
          expirationDate: service.expirationDate,
          isOption: service.isOption,
          productType: service.productType,
          subscriptionDate: service.subscriptionDate,
          productId: subData,
        };
      }
      return service;
    });

    let result = []

    if (type === "service") {
      result = transformedServices;
    } else if (type === 'product') {
      result = products;
    } else {
      result = [...products, ...transformedServices];
    }

    return { success: true, products: result };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

module.exports = {
  createProductService,
  getAllProducts,
  //   updateSubscription,
  //   deleteSubscription,
  //   findActiveSubscribers,
  findActiveSubscribers,
  getAllUserSubscriptions,
  addProductToUser,
};
