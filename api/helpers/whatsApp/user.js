const { getAllSubscriptions } = require('../../services/subscription.service');
const MonetBil = require('../MonetBil');
require('dotenv').config(); // Charger les variables d'environnement depuis le fichier .env

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
        // Étape 3 : Effectuer le paiement
        const selectedForfait = transactionSteps[msg.from].selectedForfait;
        MonetBil.processPayment(msg, phoneNumber, selectedForfait, transactionSteps);
      } else {
        const invalidPhoneNumberMessage = 'Le numéro de téléphone est invalide. Veuillez saisir un numéro de téléphone au format valide (ex: 6xxxxxxxx).';
        msg.reply(invalidPhoneNumberMessage);
      }
    } else if (userResponse === COMMAND_NAME.NFT) {
      const invalidRequestMessage = `Bot en cours de développement pour répondre à tous ces services ultérieurement.`;
      msg.reply(invalidRequestMessage); 
    } else if (userResponse === COMMAND_NAME.WELNESS) {
      const invalidRequestMessage = `Bot en cours de développement pour répondre à tous ces services ultérieurement.`;
      msg.reply(invalidRequestMessage);
    } else if (userResponse === '0') {
      // Réinitialiser l'état de l'utilisateur et renvoyer le message de bienvenue
      delete transactionSteps[msg.from];
      welcomeStatusUser[msg.from] = false;
      msg.reply(welcomeMessage);
    }else {
      // Gérer d'autres cas d'utilisation ou afficher un message d'erreur
      const invalidRequestMessage = `Bot en cours de développement pour répondre à tous ces services ultérieurement.`;
      msg.reply(invalidRequestMessage);
    }
  }
};

module.exports = {
  UserCommander,
};
