const axios = require('axios');
const { getAllProduct } = require('../../services/product.service');
const { getAllSubscriptions } = require('../../services/subscription.service');
const MonetBil = require('../MonetBil');
require('dotenv').config(); // Charger les variables d'environnement depuis le fichier .env
const { MessageMedia } = require('whatsapp-web.js');

const welcomeStatusUser = {};
const transactionSteps = {};

const COMMAND_NAME = { ENSEIGNEMENTS: '1', NFT: '2', WELNESS: '3' };

const UserCommander = async (msg) => {

  const contact = await msg.getContact();
  const welcomeMessage = `🌍 Salut ${contact.pushname} et bienvenue à la Fondation Bibemella, le temple de la Culture Africaine. Explorez nos services exceptionnels pour une expérience unique :

    1️⃣ Pour recevoir nos enseignements, tapez 1.
    2️⃣ Pour découvrir notre collection d'objets d'art numérique (NFTs), tapez 2.
    3️⃣ Pour en savoir plus sur notre Wellness Center et nos journées sportives, tapez 3.
    0️⃣ Pour revenir au menu principal, tapez 0.

    Nous sommes là pour vous aider à vous immerger dans la culture africaine et à répondre à vos besoins. Tapez simplement le numéro correspondant pour commencer. Comment pouvons-nous vous assister aujourd'hui ? 🤝`;

  if (!welcomeStatusUser[msg.from]) {
    // Envoyer le message de bienvenue la première fois
    msg.reply(welcomeMessage);

    // Enregistrer l'état de bienvenue pour cet utilisateur
    welcomeStatusUser[msg.from] = true;
  } else if (!msg.isGroupMsg) {
    const userResponse = msg.body.trim();

    if (userResponse === COMMAND_NAME.ENSEIGNEMENTS && !transactionSteps[msg.from]) {
      const allSubscriptionsResponse = await getAllSubscriptions();
      if (allSubscriptionsResponse.success) {
        const subscriptions = allSubscriptionsResponse.subscriptions;
        const replyMessage = 'Choisissez un forfait en répondant avec son numéro :\n' +
          subscriptions.map((subscription, index) => {
            return `${index + 1}. ${subscription.description}`;
          }).join('\n');
        msg.reply(replyMessage);

        // Enregistrer l'étape de la transaction pour cet utilisateur
        transactionSteps[msg.from] = { step: 'ask_forfait', type: 'ENSEIGNEMENTS', subscriptions };
      } else {
        const replyMessage = 'Erreur lors de la récupération des forfaits.';
        msg.reply(replyMessage);
      }
    } else if (/^\d+$/.test(userResponse) && transactionSteps[msg.from] && transactionSteps[msg.from].step === 'ask_forfait') {
      const selectedForfaitIndex = parseInt(msg.body) - 1;
      const subscriptions = transactionSteps[msg.from].subscriptions;

      if (selectedForfaitIndex >= 0 && selectedForfaitIndex < subscriptions.length) {
        const selectedForfait = subscriptions[selectedForfaitIndex];
        const phoneNumberMessage = 'Veuillez entrer votre numéro de téléphone pour la transaction Mobile Money (ex: 6xxxxxxxx):';
        msg.reply(phoneNumberMessage);

        // Enregistrer l'étape de la transaction pour cet utilisateur
        transactionSteps[msg.from].step = 'ask_phone_number';
        transactionSteps[msg.from].selectedForfait = selectedForfait;
      } else {
        const invalidForfaitMessage = 'Le numéro de forfait sélectionné est invalide. Réessayez en fournissant un numéro valide.';
        msg.reply(invalidForfaitMessage);
      }
    } else if (transactionSteps[msg.from] && transactionSteps[msg.from].step === 'ask_phone_number') {
      const phoneNumber = userResponse.replace(/\s+/g, '');

      if (/^(?:\+237)?6(?:9|8|7|5)\d{7}$/.test(phoneNumber)) {
        const selectedForfait = transactionSteps[msg.from].selectedForfait;
        MonetBil.processPayment(msg, phoneNumber, selectedForfait, transactionSteps);
      } else {
        const invalidPhoneNumberMessage = 'Le numéro de téléphone est invalide. Veuillez saisir un numéro de téléphone au format valide (ex: 6xxxxxxxx).';
        msg.reply(invalidPhoneNumberMessage);
      }
    } else if (userResponse === COMMAND_NAME.NFT) {
      // Récupérer la liste des produits depuis la base de données
      const allProductsResponse = await getAllProduct();
      if (allProductsResponse.success) {
        const products = allProductsResponse.products;
    
        for (let i = 0; i < products.length; i++) {
          const product = products[i];
    
          // Récupérer l'image en tant que données binaires
          const imageResponse = await axios.get(product.image, { responseType: 'arraybuffer' });
          const imageBase64 = Buffer.from(imageResponse.data).toString('base64');
    
          // Créer un objet MessageMedia avec l'image
          const media = new MessageMedia('image/jpeg', imageBase64);
    
          // Construire le message avec les détails
          let replyMessage = `*${product.name}*\n\n${product.description}\n\n${product.price} XAF\n\nPlus de détails: ${product.link}`;
          
          // Ajouter un message demandant si l'utilisateur souhaite acheter le produit
          replyMessage += `\n\nVoulez-vous acheter ce produit ? Si oui, *tapez ${i + 1}*.`;
    
          // Envoyer l'image avec le texte en utilisant la fonction caption
          await msg.reply(media, msg.from, { caption: replyMessage });
        }
    
        const ProductNumberMessage = 'Entrez le numéro de NFT que vous souhaitez acheter';
        msg.reply(ProductNumberMessage);
    
        transactionSteps[msg.from] = { step: 'awaitProductNumber', products };
      } else {
        const replyMessage = 'Erreur lors de la récupération des NFTs.';
        msg.reply(replyMessage);
      }
    }    
    else if (transactionSteps[msg.from] && transactionSteps[msg.from].step === 'awaitProductNumber') {
      const products = transactionSteps[msg.from].products; // Récupérer les produits précédemment chargés
    
      const userProductNumber = parseInt(userResponse); // Convertir la réponse de l'utilisateur en nombre
      const selectedProduct = products[userProductNumber - 1];
    
      if (selectedProduct) {
        // Le produit a été trouvé. Demandez au client le mode de paiement.
        const paymentMethodMessage = 'Choisissez le mode de paiement :\n1. Paiement Mobile Money\n2. Paiement Ejara';
        msg.reply(paymentMethodMessage);
    
        // Enregistrez le produit sélectionné pour la prochaine étape.
        transactionSteps[msg.from] = { step: 'awaitPaymentMethod', selectedProduct };
      } else {
        const invalidProductNumberMessage = 'Le numéro que vous avez entré est introuvable. Veuillez entrer un numéro valide.';
        msg.reply(invalidProductNumberMessage);
      }
    }
     else if (transactionSteps[msg.from] && transactionSteps[msg.from].step === 'awaitPaymentMethod') {

      if (userResponse === '1') {
        // L'utilisateur a choisi le paiement Mobile Money.
        const phoneNumberMessage = 'Veuillez entrer votre numéro de téléphone pour la transaction Mobile Money (ex: 6xxxxxxxx):';
        msg.reply(phoneNumberMessage);

        transactionSteps[msg.from] = { step: 'askPhoneNumber', selectedProduct };
      } else if (userResponse === '2') {
        // L'utilisateur a choisi le paiement Ejara.
        const replyMessage = 'Bot en cours de développement.';
        msg.reply(replyMessage);

        transactionSteps[msg.from] = { step: 'start' };
      } else {
        const invalidPaymentMethodMessage = 'Choisissez une option de paiement valide (1 ou 2).';
        msg.reply(invalidPaymentMethodMessage);
      }
    } else if (transactionSteps[msg.from] && transactionSteps[msg.from].step === 'askPhoneNumber') {
      const phoneNumber = userResponse.replace(/\s+/g, '');

      if (/^(?:\+237)?6(?:9|8|7|5)\d{7}$/.test(phoneNumber)) {
        const selectedProduct = transactionSteps[msg.from].selectedProduct;
        MonetBil.processPayment(msg, phoneNumber, selectedProduct, transactionSteps);
      } else {
        const invalidPhoneNumberMessage = 'Le numéro de téléphone est invalide. Veuillez saisir un numéro de téléphone au format valide (ex: 6xxxxxxxx).';
        msg.reply(invalidPhoneNumberMessage);
      }
    }
    else if (userResponse === COMMAND_NAME.WELNESS) {
      const invalidRequestMessage = `Bot en cours de développement pour répondre à tous ces services ultérieurement.`;
      msg.reply(invalidRequestMessage);
    } else if (userResponse === '0') {
      // Réinitialiser l'état de l'utilisateur et renvoyer le message de bienvenue
      delete transactionSteps[msg.from];
      welcomeStatusUser[msg.from] = false;
      msg.reply(welcomeMessage);
    } else {
      // Gérer d'autres cas d'utilisation ou afficher un message d'erreur
      const invalidRequestMessage = `Bot en cours de développement pour répondre à tous ces services ultérieurement.`;
      msg.reply(invalidRequestMessage);
    }
  }
};

module.exports = {
  UserCommander,
};
