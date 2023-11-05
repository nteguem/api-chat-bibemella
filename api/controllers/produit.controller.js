const productService = require('../services/product.service');

const createProduct = async (req, res) => {
    const productData = req.body;
    const response = await productService.createProduct(productData);

    if (response.success) {
        res.json({ message: response.message });
    } else {
        res.status(500).json({ message: 'Erreur lors de la création du product', error: response.error });
    }
};

const getAllProduct = async (req, res) => {
    const response = await productService.getAllProduct();

    if (response.success) {
        res.json(response.products);
    } else {
        res.status(500).json({ message: 'Erreur lors de la récupération des products', error: response.error });
    }
};

const updateProducts = async (req, res) => {
    const productId = req.params.productId;
    const updatedData = req.body;
    const response = await productService.updateSubscription(productId, updatedData);

    if (response.success) {
        res.json(response.product);
    } else {
        res.status(404).json({ message: response.message });
    }
};

const deleteProduct = async (req, res) => {
    const productId = req.params.productId;
    const response = await productService.deleteProduct(productId);

    if (response.success) {
        res.json({ message: response.message });
    } else {
        res.status(404).json({ message: response.message });
    }
};

module.exports = {
    createProduct,
    getAllProduct,
    updateProducts,
    deleteProduct
};
