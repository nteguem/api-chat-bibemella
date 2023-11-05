// Dans votre module createProductMessage.js

const { MessageMedia } = require('whatsapp-web.js');

const createProductMessage = async (product) => {
  const productMessage = [];

  // Ajouter l'image
  const imageMedia = await MessageMedia.fromUrl(product.image);
  productMessage.push(imageMedia);

  // Ajouter les caractéristiques du produit
  productMessage.push(product.name);
  productMessage.push(product.description);
  productMessage.push(product.price);
  productMessage.push(product.link);

  return productMessage.map(item => item.toString()); // Convertissez chaque élément en chaîne
};

module.exports = {
  createProductMessage,
};
