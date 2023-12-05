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
        const url = await uploadFileWithFormidable(files.image, "product");
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
};

const getAllProducts = async (req, res) => {
  const { type } = req.body;
  const page = req.query.page;
  const limit = req.query.limit;
  const response = await productService.getAllProducts(type || null, page, limit);

  if (response.success) {
    res.json(response.products);
  } else {
    res.status(500).json({
      message: "Erreur lors de la récupération des produit",
      error: response.error,
    });
  }
};

const getActiveSubscribers = async (req, res) => {
  try {
    const { isOption, id } = req.body;

    if (isOption === undefined || id === undefined) {
      return res
        .status(400)
        .json({ message: "Paramètres manquants dans le corps de la requête" });
    }

    const response = await productService.findActiveSubscribers(isOption, id);

    if (response.success) {
      res.json(response.activeSubscribers);
    } else {
      res.status(500).json({
        message: "Erreur lors de la récupération des utilisateurs actifs",
        error: response.error,
      });
    }
  } catch (error) {
    res.status(500).json({
      message:
        "Erreur interne du serveur lors de la récupération des utilisateurs actifs",
    });
  }
};

const updateService = async (req, res) => {
  const serviceId = req.params.id;
  const updatedData = req.body;
  const response = await productService.updateService(
    serviceId,
    updatedData
  );

  if (response.success) {
    res.json({data: response.service, success: true});
  } else {
    res.status(404).json({ message: response.message });
  }
};

const updateProduct = async (req, res) => {
  try {
    const form = new formidable.IncomingForm({ multiples: true });

    form.parse(req, async (err, fields, files) => {
      if (files && files.image && files.image.name) {
        const url = await uploadFileWithFormidable(files.image, "product");
        if (url) {
          fields.image = url;
        }
      }

      // Get the event ID from the request parameters or body
      const productId = req.params.id || fields.id;

      if (!productId) {
        return res
          .status(400)
          .json({ success: false, message: "Product ID is required" });
      }

      // Find the event by ID
      const responseProduct = await productService.findProductById(productId);

      if (!responseProduct.success) {
        return res
          .status(404)
          .json({ success: false, message: "Product not found" });
      }

      let existingProduct = responseProduct.product;

      // Update the event fields
      existingProduct.name = fields.name || existingProduct.name;
      existingProduct.image = fields.image || existingProduct.image;
      existingProduct.description =
        fields.description || existingProduct.description;
      existingProduct.price = fields.price || existingProduct.price;
      existingProduct.advantage = fields.advantage || existingProduct.advantage;
      existingProduct.link = fields.link || existingProduct.link;

      // Save the updated event
      const response = await existingProduct.save();

      if (response) {
        res.json({ success: true, data: response });
      } else {
        res.status(500).json({
          message: "Error updating the event",
          error: response.error,
        });
      }
    });
  } catch (error) {
    console.error(error);
    res.status(400).json({ success: false });
  }
};

const deleteOptionFromService = async (req, res) => {
  const productId = req.params.id;
  const optionId = req.params.optionId;
  const response = await productService.deleteProductOption(productId, optionId);

  if (response.success) {
    res.json({ message: response.message, success: true });
  } else {
    res.status(404).json({ message: response.message });
  }
};

const deleteProductService = async (req, res) => {
  const productId = req.params.id;
  const response = await productService.deleteProduct(productId);

  if (response.success) {
    res.json({ message: response.message });
  } else {
    res.status(404).json({ message: response.message });
  }
};

const getAllSubscriptionsUser = async (req, res) => {
  const phoneNumber = req.params.phoneNumber;
  const type = req.body.type;
  const response = await productService.getAllUserSubscriptions(
    phoneNumber,
    type
  );

  if (response.success) {
    res.json(response);
  } else {
    res.status(500).json({
      message:
        "Erreur lors de la récupération des souscriptions de l'utilisateur",
      error: response.error,
    });
  }
};

const addProductToUser = async (req, res) => {
  const { phoneNumber } = req.body;
  const { addSubscription, transaction_id, operator } = req.body;

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
    res.status(500).json({
      message: "Erreur lors de l'ajout de la souscription",
      error: response.error,
    });
  }
};

module.exports = {
  createProduct,
  createService,
  getAllSubscriptionsUser,
  addProductToUser,
  getActiveSubscribers,
  getAllProducts,
  updateService,
  deleteProductService,
  updateProduct,
  deleteOptionFromService
};
