const Product = require('../models/product.model')

async function createProduct(productData) {
    try {
        const newProduct = new Product(productData);
        await newProduct.save();
        return { success: true, message: 'Product créé avec succès' };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function getAllProduct() { 
    try {
        const products = await Product.find();
        return { success: true, products };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function updateProducts(productId, updatedData) {
    try {
        const updatedProduct = await Product.findByIdAndUpdate(productId, updatedData, { new: true });

        if (!updatedProduct) {
            return { success: false, message: 'Product non trouvé' };
        }

        return { success: true, subscription: updatedProduct };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function deleteProduct(productId) {
    try {
        const deleteProduct = await Product.findByIdAndDelete(productId);

        if (!deleteProduct) {
            return { success: false, message: 'Product non trouvé' };
        }

        return { success: true, message: 'Product supprimé avec succès' };
    } catch (error) {
        return { success: false, error: error.message };
    }
}



module.exports = {
    createProduct,
    getAllProduct,
    updateProducts,
    deleteProduct,
};
