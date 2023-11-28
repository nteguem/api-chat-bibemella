const uploadFileWithFormidable = require("../helpers/uploadCloudinary");
const productService = require("../services/product.service");
const formidable = require("formidable-serverless");

const createService = async (req, res) => {
    const productData = req.body;
    
    const response = await productService.createProductService(productData);

    if (response.success) {
        res.json({ message: response.message });
    } else {
        res.status(500).json({
            message: "Erreur lors de la création du forfait",
            error: response.error,
        });
    }
};

const createProduct = async (req, res) => {
    try {
        const form = new formidable.IncomingForm({ multiples: true });
    
        form.parse(req, async (err, fields, files) => {
          if (files && files.image && files.image.name) {
            const url = await uploadFileWithFormidable(
              files.image,
              "product"
            );
            if (url) {
              fields.image = url;
            }
          }
    
          let productData = {
            name: fields.name,
            image: fields.image,
            description: fields.description,
            price: fields?.price,
            type: fields?.type,
            advantage: fields?.advantage,
            link: fields?.link,
          };
    
          const response = await productService.createProductService(productData);
    
          if (response.success) {
            res.json({ message: response.message });
          } else {
            res.status(500).json({
              message: "Erreur lors de la création de l'evenement",
              error: response.error,
            });
          }
        });
      } catch (error) {
        res.status(400).json({ success: false });
      }
}

const getAllProducts = async (req, res) => {
    const { type } = req.body;
    const response = await productService.getAllProducts(type || null);

    if (response.success) {
        res.json(response.products);
    } else {
        res
            .status(500)
            .json({
                message: "Erreur lors de la récupération des produit",
                error: response.error,
            });
    }
};

const getActiveSubscribers = async (req, res) => {
    try {
        const { isOption, id } = req.body;

        if (isOption === undefined || id === undefined) {
            return res.status(400).json({ message: 'Paramètres manquants dans le corps de la requête' });
        }

        const response = await productService.findActiveSubscribers(isOption, id);

        if (response.success) {
            res.json(response.activeSubscribers);
        } else {
            res.status(500).json({ message: 'Erreur lors de la récupération des utilisateurs actifs', error: response.error });
        }
    } catch (error) {
        
        res.status(500).json({ message: 'Erreur interne du serveur lors de la récupération des utilisateurs actifs' });
    }
};

//   const updateSubscription = async (req, res) => {
//     const subscriptionId = req.params.subscriptionId;
//     const updatedData = req.body;
//     const response = await subscriptionService.updateSubscription(subscriptionId, updatedData);

//     if (response.success) {
//       res.json(response.subscription);
//     } else {
//       res.status(404).json({ message: response.message });
//     }
//   };

//   const deleteSubscription = async (req, res) => {
//     const subscriptionId = req.params.subscriptionId;
//     const response = await subscriptionService.deleteSubscription(subscriptionId);

//     if (response.success) {
//       res.json({ message: response.message });
//     } else {
//       res.status(404).json({ message: response.message });
//     }
//   };

// const getActiveSubscribers = async (req, res) => {
//   const {name} = req.body;
//     const response = await subscriptionService.findActiveSubscribers(name);
//     if (response.success) {
//         res.json(response.data);
//     } else {
//         res.status(500).json({ message: 'Erreur lors de la récupération des abonnés actifs', error: response.error });
//     }
// };

// // const checkActiveSubscription = async (req, res) => {
// //     const phoneNumber = req.params.phoneNumber;
// //     const response = await subscriptionService.hasActiveSubscription(phoneNumber);

// //     if (response.success) {
// //         res.json({ hasActiveSubscription: response.hasActiveSubscription });
// //     } else {
// //         res.status(500).json({ message: 'Erreur lors de la vérification de l\'abonnement actif', error: response.error });
// //     }
// // };

const getAllSubscriptionsUser = async (req, res) => {
    const phoneNumber = req.params.phoneNumber;
    const type = req.body.type;
    const response = await productService.getAllUserSubscriptions(phoneNumber, type);

    if (response.success) {
        res.json(response);
    } else {
        res.status(500).json({ message: 'Erreur lors de la récupération des souscriptions de l\'utilisateur', error: response.error });
    }
};

const addProductToUser = async (req, res) => {
    const { phoneNumber } = req.body;
    const {addSubscription, transaction_id, operator} = req.body;

    const response = await productService.addProductToUser(
        phoneNumber,
        addSubscription, 
        transaction_id, 
        operator
    );

    if (response.success) {
        res.json({
            message: response.message,
            subscription: response.subscription,
        });
    } else {
        res
            .status(500)
            .json({
                message: "Erreur lors de l'ajout de la souscription",
                error: response.error,
            });
    }
};

module.exports = {
    createProduct,
    createService,
    // getActiveSubscribers,
    getAllSubscriptionsUser,

    addProductToUser,
    getActiveSubscribers,

    getAllProducts,
    // updateSubscription,
    // deleteSubscription
};
