const axios = require('axios');
const { getAllProduct } = require('../../services/product.service');
const { getAllSubscriptions } = require('../../services/subscription.service');
const MonetBil = require('../MonetBil');
require('dotenv').config(); // Charger les variables d'environnement depuis le fichier .env
const { MessageMedia } = require('whatsapp-web.js');
const { getAllTeachings } = require('../../services/teaching.service');

const welcomeStatusUser = {};
const transactionSteps = {};

const COMMAND_NAME = { ENSEIGNEMENTS: '1', NFT: '2', WELNESS: '3', IA: '4', PRODUITS: '5' };

const UserCommander = async (msg) => {

  const contact = await msg.getContact();
  const welcomeMessage = `🌍 Salut ${contact.pushname} et bienvenue à la Fondation Bibemella, le temple de la Culture Africaine. Explorez nos services exceptionnels pour une expérience unique :
  
1️⃣ Pour recevoir nos enseignements, tapez 1.
2️⃣ Pour découvrir notre collection d'objets d'art numérique (NFTs), tapez 2.
3️⃣ Pour en savoir plus sur notre Wellness Center et nos journées sportives, tapez 3.
4️⃣ Pour interagir avec notre intelligence artificielle, tapez 4.
5️⃣ Mes produits et mes services, tapez 5.

Nous sommes là pour vous aider à vous immerger dans la culture africaine et à répondre à vos besoins. Tapez simplement le numéro correspondant pour commencer. Comment pouvons-nous vous assister aujourd'hui ? 🤝`;

  const MenuPrincipal = `📚 Votre menu principal :

1️⃣ Pour recevoir nos enseignements, tapez 1.
2️⃣ Pour découvrir notre collection d'objets d'art numérique (NFTs), tapez 2.
3️⃣ Pour en savoir plus sur notre Wellness Center et nos journées sportives, tapez 3.
4️⃣ Pour parler à un assistant artificiel, tapez 4.
5️⃣ Pour en savoir plus sur vos produits et services, tapez 5.

Nous sommes là pour vous aider à vous immerger dans la culture africaine et à répondre à vos besoins.`;

  if (!welcomeStatusUser[msg.from]) {
    // Envoyer le message de bienvenue la première fois
    msg.reply(welcomeMessage);

    // Enregistrer l'état de bienvenue pour cet utilisateur
    welcomeStatusUser[msg.from] = true;
  } else if (!msg.isGroupMsg) {
    const userResponse = msg.body.trim();

    if (userResponse === '#') {
      // Réinitialiser l'état de l'utilisateur et renvoyer le message de bienvenue
      delete transactionSteps[msg.from];
      msg.reply(MenuPrincipal);
    } else if (userResponse === COMMAND_NAME.ENSEIGNEMENTS && !transactionSteps[msg.from]) {
      const allTeachingsResponse = await getAllTeachings();
      if (allTeachingsResponse.success) {
        const teachings = allTeachingsResponse.teachings;

        // Affichez les types d'enseignement à l'utilisateur avec des numéros
        const replyMessage = 'Choisissez un enseignement en répondant avec son numéro :\n' +
          teachings.map((teaching, index) => {
            return `${index + 1}. ${teaching.type}`;
          }).join('\n');
        msg.reply(replyMessage + '\n\n#. Menu principal');

        // Enregistrez l'étape de la transaction pour cet utilisateur
        transactionSteps[msg.from] = { step: 'awaitTeachingType', type: 'ENSEIGNEMENTS', teachings };
      } else {
        const replyMessage = 'Erreur lors de la récupération des enseignements.';
        msg.reply(replyMessage);
      }
    } else if (transactionSteps[msg.from] && transactionSteps[msg.from].step === 'awaitTeachingType') {
      const userChoice = parseInt(userResponse);
      const teachings = transactionSteps[msg.from].teachings;
      const selectedTeaching = teachings[userChoice - 1];

      // Vérifiez si le type contient des données dans l'objet "name"
      if (selectedTeaching.name.length === 0) {
        // Si l'objet "name" est vide, demandez à l'utilisateur s'il souhaite intégrer ce type
        msg.reply(`*${selectedTeaching.type} : ${selectedTeaching.price} XAF*\nSouhaitez-vous recevoir des informations sur le ${selectedTeaching.type} ?\n\nRépondez par "Oui" ou "Non".`);
        transactionSteps[msg.from].step = 'awaitTeachingInfoRequest';
        transactionSteps[msg.from].selectedTeaching = selectedTeaching;
      } else {
        // Si l'objet "name" contient des données, affichez ces données à l'utilisateur avec des numéros pour chaque sous-option
        const teachingOptions = selectedTeaching.name.map((teachingOption, index) => {
          return `${index + 1}. ${teachingOption.nameTeaching} - ${teachingOption.price} XAF`;
        });
        const teachingOptionsMessage = `Choisissez un enseignement pour les ${selectedTeaching.type} en entrant son numéro :\n${teachingOptions.join('\n')}
        \n*. Menu précédent\n#. Menu principal`;
        msg.reply(teachingOptionsMessage);

        // Attendez que l'utilisateur choisisse une sous-option et demandez-lui s'il souhaite intégrer cette sous-option
        transactionSteps[msg.from].step = 'awaitSubTeachingChoice';
        transactionSteps[msg.from].selectedTeaching = selectedTeaching;
      }
    } else if (transactionSteps[msg.from] && transactionSteps[msg.from].step === 'awaitTeachingInfoRequest') {
      // Attendez la réponse de l'utilisateur s'il souhaite intégrer le type
      const userResponseLower = userResponse.toLowerCase();

      if (userResponseLower === 'oui') {
        // Le client a confirmé l'achat, continuez avec les options de paiement.
        const phoneNumberMessage = 'Veuillez entrer votre numéro de téléphone pour la transaction Mobile Money (ex: 6xxxxxxxx):';
        msg.reply(phoneNumberMessage);

        transactionSteps[msg.from].step = 'awaitPhoneNumber';
      } else if (userResponseLower === 'non') {
        // Redirigez l'utilisateur vers le choix du type d'enseignement
        const teachings = transactionSteps[msg.from].teachings;
        const replyMessage = 'Choisissez un enseignement en répondant avec son numéro :\n' +
          teachings.map((teaching, index) => {
            return `${index + 1}. ${teaching.type}`;
          }).join('\n');
        msg.reply(replyMessage);

        transactionSteps[msg.from].step = 'awaitTeachingType';
      } else {
        const invalidConfirmationMessage = 'Répondez par "Oui" ou "Non".';
        msg.reply(invalidConfirmationMessage);
      }
    } else if (transactionSteps[msg.from] && transactionSteps[msg.from].step === 'awaitPhoneNumber') {
      const phoneNumber = userResponse.replace(/\s+/g, '');

      if (/^(?:\+237)?6(?:9|8|7|5)\d{7}$/.test(phoneNumber)) {
        // Vous avez le numéro de téléphone et les détails de l'enseignement choisi, initiez le paiement
        const selectedTeaching = transactionSteps[msg.from]?.selectedTeaching;
        MonetBil.processPayment(msg, phoneNumber, selectedTeaching, transactionSteps);
      } else {
        const invalidPhoneNumberMessage = 'Le numéro de téléphone est invalide. Veuillez saisir un numéro de téléphone au format valide (ex: 6xxxxxxxx).';
        msg.reply(invalidPhoneNumberMessage);
      }
    } else if (transactionSteps[msg.from] && transactionSteps[msg.from].step === 'awaitSubTeachingChoice') { 
      const teachingOptionNumber = parseInt(userResponse);
      const selectedTeaching = transactionSteps[msg.from].selectedTeaching;

      if (teachingOptionNumber >= 1 && teachingOptionNumber <= selectedTeaching.name.length) {
        // L'utilisateur a choisi un enseignement, affichez les détails de l'enseignement
        const selectedTeachingOption = selectedTeaching.name[teachingOptionNumber - 1];
        const teachingDetailsMessage = `*Enseignement choisi :* \nCours de langue: ${selectedTeachingOption.nameTeaching}\n` +
          `Prix : ${selectedTeachingOption.price} XAF\n` +
          `Durée : ${selectedTeachingOption.durationInDay} jours\n\n` +
          `Voulez-vous souscrire à cet enseignement ? \nRépondez par "Oui" ou "Non".`;

        msg.reply(teachingDetailsMessage);

        // Enregistrez l'étape de la transaction pour l'adhésion
        transactionSteps[msg.from].step = 'awaitBuyConfirmation';
        transactionSteps[msg.from].selectedTeachingOption = selectedTeachingOption;
      } else if (userResponse === '*') {
        // L'utilisateur veut revenir à l'étape précédente
        const allTeachingsResponse = await getAllTeachings();
        const teachings = allTeachingsResponse.teachings;
        const replyMessage = 'Choisissez un enseignement en répondant avec son numéro :\n' +
          teachings.map((teaching, index) => {
            return `${index + 1}. ${teaching.type}`;
          }).join('\n');
        msg.reply(replyMessage + '\n\n#. Menu principal');
        transactionSteps[msg.from].step = 'awaitTeachingType'
      } else {
        const invalidTeachingOptionMessage = 'Le numéro que vous avez entré est invalide. Veuillez entrer un numéro valide.';
        msg.reply(invalidTeachingOptionMessage);
      }
    } else if (transactionSteps[msg.from] && transactionSteps[msg.from].step === 'awaitBuyConfirmation') {
      const userResponseLower = userResponse.toLowerCase();
      if (userResponseLower === 'oui') {
        // Le client a confirmé l'achat, continuez avec les options de paiement. 
        const phoneNumberMessage = 'Veuillez entrer votre numéro de téléphone pour la transaction Mobile Money (ex: 6xxxxxxxx):';
        msg.reply(phoneNumberMessage);

        transactionSteps[msg.from].step = 'await-phone-number';
      } else if (userResponseLower === 'non') {
        // Redirigez l'utilisateur vers le choix du type d'enseignement
        const allTeachingsResponse = await getAllTeachings();
        const teachings = allTeachingsResponse.teachings;
        const replyMessage = 'Choisissez un enseignement en répondant avec son numéro :\n' +
          teachings.map((teaching, index) => {
            return `${index + 1}. ${teaching.type}`;
          }).join('\n');
        msg.reply(replyMessage + '\n\n#. Menu principal');
        transactionSteps[msg.from].step = 'awaitTeachingType';
      } else {
        const invalidConfirmationMessage = 'Répondez par "Oui" ou "Non".';
        msg.reply(invalidConfirmationMessage); 
      }
    } else if (transactionSteps[msg.from] && transactionSteps[msg.from].step === 'await-phone-number') {
      const phoneNumber = userResponse.replace(/\s+/g, '');

      if (/^(?:\+237)?6(?:9|8|7|5)\d{7}$/.test(phoneNumber)) {
        // Vous avez le numéro de téléphone et les détails de l'enseignement choisi, initiez le paiement
        const selectedTeachingOption = transactionSteps[msg.from]?.selectedTeachingOption;
        MonetBil.processPayment(msg, phoneNumber, selectedTeachingOption, transactionSteps);
      } else {
        const invalidPhoneNumberMessage = 'Le numéro de téléphone est invalide. Veuillez saisir un numéro de téléphone au format valide (ex: 6xxxxxxxx).';
        msg.reply(invalidPhoneNumberMessage);
      }
    } else if (userResponse === COMMAND_NAME.NFT && transactionSteps[msg.from] && transactionSteps[msg.from].step !== 'awaitProductNumber') {
      // Récupérer la liste des produits depuis la base de données
      console.log(userResponse)
      const allProductsResponse = await getAllProduct(); 
      if (allProductsResponse.success) {
        const products = allProductsResponse.products; 

        const productMessage = products.map((product, index) => {
          return `${index + 1}. ${product.name} - ${product.price} XAF\n`;
        });

        const productListMessage = `${productMessage.join('')}\n*Sélectionnez un NFT en entrant son numéro*\n\n#. Menu principal`;
        msg.reply(productListMessage);

        transactionSteps[msg.from] = { step: 'awaitProductNumber', products };
      } else {
        const replyMessage = 'Erreur lors de la récupération des produits.';
        msg.reply(replyMessage);
      }
    } else if (transactionSteps[msg.from] && transactionSteps[msg.from].step === 'awaitProductNumber') {
      const userProductNumber = parseInt(userResponse, 10);
      const products = transactionSteps[msg.from].products;
      const selectedProduct = products[userProductNumber - 1];



      if (selectedProduct) {
        // Afficher les détails du produit
        const productDetailsMessage = `*${selectedProduct.name}*\n\n*Description :*\n${selectedProduct.description}\n\n*Avantage* :\n${selectedProduct.advantage.split('\n').map(advantage => `• ${advantage}`).join('\n')}\n\n*Prix :* ${selectedProduct.price}\n\nPour plus de détails : ${selectedProduct.link}`;
        msg.reply(productDetailsMessage);

        // Demander si l'utilisateur souhaite acheter le produit
        const buyConfirmationMessage = 'Voulez-vous acheter ce NFT ? Entrez "Oui" ou "Non".';
        msg.reply(buyConfirmationMessage);

        transactionSteps[msg.from].step = 'awaitBuyConfirmationProduct';
        transactionSteps[msg.from].selectedProduct = selectedProduct;
      } else {
        const invalidProductNumberMessage = 'Le numéro que vous avez entré est invalide. Veuillez entrer un numéro valide.';
        msg.reply(invalidProductNumberMessage);
      }
    } else if (transactionSteps[msg.from] && transactionSteps[msg.from].step === 'awaitBuyConfirmationProduct') {
      if (userResponse.toLowerCase() === 'oui') {
        // Demander au client de confirmer l'achat
        const confirmationMessage = `Vous avez choisi d'acheter le NFT:\n*${transactionSteps[msg.from].selectedProduct.name} - ${transactionSteps[msg.from].selectedProduct.price} XAF*. \n\nConfirmez vous l'achat de ce NFT? "Oui" ou "Non".`;
        msg.reply(confirmationMessage);

        transactionSteps[msg.from].step = 'awaitBuyConfirmationConfirmation';
      } else if (userResponse.toLowerCase() === 'non') {
        // Rediriger l'utilisateur vers la liste des NFT
        const products = transactionSteps[msg.from].products;
        const productMessage = products.map((product, index) => {
          return `${index + 1}. ${product.name} - ${product.price} XAF\n`;
        });
        const productListMessage = `${productMessage.join('')}\n*Sélectionnez un NFT en entrant son numéro*\n\n#. Menu principal`;
        msg.reply(productListMessage);

        transactionSteps[msg.from].step = 'awaitProductNumber';
      } else {
        const invalidConfirmationMessage = 'Veuillez répondre avec "oui" ou "non".';
        msg.reply(invalidConfirmationMessage);
      }
    } else if (transactionSteps[msg.from] && transactionSteps[msg.from].step === 'awaitBuyConfirmationConfirmation') {
      if (userResponse.toLowerCase() === 'oui') {
        // Le client a confirmé l'achat, continuez avec les options de paiement.
        const paymentMethodMessage = 'Choisissez le mode de paiement :\n1. Paiement Mobile Money\n2. Paiement par Crypto';
        msg.reply(paymentMethodMessage);

        transactionSteps[msg.from].step = 'awaitPaymentMethod';
      } else if (userResponse.toLowerCase() === 'non') {
        // Annuler l'achat et rediriger vers la liste des produits
        const products = transactionSteps[msg.from].products;
        const productMessage = products.map((product, index) => {
          return `${index + 1}. ${product.name} - ${product.price} XAF\n`;
        });
        const productListMessage = `${productMessage.join('')}\n*Sélectionnez un NFT en entrant son numéro*\n\n#. Menu principal`;
        msg.reply(productListMessage);

        transactionSteps[msg.from].step = 'awaitProductNumber';
      } else {
        const invalidConfirmationMessage = 'Veuillez répondre avec "Oui" ou "Non".';
        msg.reply(invalidConfirmationMessage);
      }
    } else if (transactionSteps[msg.from] && transactionSteps[msg.from].step === 'awaitPaymentMethod') {
      if (userResponse === '1') {
        // L'utilisateur a choisi le paiement Mobile Money.
        const phoneNumberMessage = 'Veuillez entrer votre numéro de téléphone pour la transaction Mobile Money (ex: 6xxxxxxxx):';
        msg.reply(phoneNumberMessage);

        transactionSteps[msg.from].step = 'askPhoneNumber';
      } else if (userResponse === '2') {
        // L'utilisateur a choisi le paiement Ejara.
        const replyMessage = 'Bot en cours de développement.';
        msg.reply(replyMessage);

        transactionSteps[msg.from].step = 'start';
      } else {
        const invalidPaymentMethodMessage = 'Choisissez une option de paiement valide (1 ou 2).';
        msg.reply(invalidPaymentMethodMessage);
      }
    } else if (transactionSteps[msg.from] && transactionSteps[msg.from].step === 'askPhoneNumber') {
      const phoneNumber = userResponse.replace(/\s+/g, '');

      if (/^(?:\+237)?6(?:9|8|7|5)\d{7}$/.test(phoneNumber)) {
        // L'utilisateur a confirmé le paiement, vous pouvez maintenant traiter la transaction avec Monetbil
        const selectedProduct = transactionSteps[msg.from]?.selectedProduct;
        MonetBil.processPayment(msg, phoneNumber, selectedProduct, transactionSteps);
        transactionSteps[msg.from].step = 'start';
      } else {
        const invalidPhoneNumberMessage = 'Le numéro de téléphone est invalide. Veuillez saisir un numéro de téléphone au format valide (ex: 6xxxxxxxx).';
        msg.reply(invalidPhoneNumberMessage);
      }
    } else if (userResponse === COMMAND_NAME.WELNESS) {
      const invalidRequestMessage = `Bot en cours de développement pour répondre à tous ces services ultérieurement.`;
      msg.reply(invalidRequestMessage);

      delete transactionSteps[msg.from];
      msg.reply(MenuPrincipal);
    } else if (userResponse === COMMAND_NAME.IA) {
      const invalidRequestMessage = `Bot en cours de développement pour répondre à tous ces services ultérieurement.`;
      msg.reply(invalidRequestMessage);

      delete transactionSteps[msg.from];
      msg.reply(MenuPrincipal);
    } else if (userResponse === COMMAND_NAME.PRODUITS) {
      const invalidRequestMessage = `Aucun produits et services disponibles pour le moment...`;
      msg.reply(invalidRequestMessage);

      delete transactionSteps[msg.from];
      msg.reply(MenuPrincipal);
    } else {
      // Gérer d'autres cas d'utilisation ou afficher un message d'erreur
      delete transactionSteps[msg.from];
      msg.reply(MenuPrincipal);;
    }
  }
};

module.exports = {
  UserCommander,
};
