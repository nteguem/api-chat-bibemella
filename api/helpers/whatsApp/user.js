require('dotenv').config(); // Charger les variables d'environnement depuis le fichier .env
const { getAllSubscriptions } = require('../../services/subscription.service');
const MonetBil = require('../MonetBil'); // Importer le module MonetBil

const welcomeStatusUser = {};
const subscribeKeyword = 'subscribe';

const UserCommander = async (msg, transactionSteps) => {
    if (!welcomeStatusUser[msg.from]) {

        // Envoyer le message de bienvenue la première fois
        const welcomeMessage = `🏆 Bienvenue sur Bibemella ! 🌟\n\nPrêt à prédire les événements footballistiques passionnants ? Abonnez-vous dès maintenant en tapant *${subscribeKeyword}* pour accéder à nos prédictions premium. Ne manquez plus jamais un moment clé du jeu !\n\n⚽️ Rejoignez-nous et vivez le football autrement. Tapez simplement *${subscribeKeyword}* pour commencer.`;
        msg.reply(welcomeMessage);
  
        // Enregistrer l'état de bienvenue pour cet utilisateur
        welcomeStatusUser[msg.from] = true;
      } else if (msg.body.toLowerCase().includes(subscribeKeyword) && !msg.isGroupMsg) {
  
        if (msg.body.toLowerCase().includes(subscribeKeyword) && !msg.isGroupMsg) {
          const allSubscriptionsResponse = await getAllSubscriptions();
          if (allSubscriptionsResponse.success) {
            const subscriptions = allSubscriptionsResponse.subscriptions;
            const replyMessage = 'Choisissez un forfait en répondant avec son numéro :\n' +
              subscriptions.map((subscription, index) => {
                return `${index + 1}. ${subscription.description}`;
              }).join('\n');
            msg.reply(replyMessage);
          } else {
            const replyMessage = 'Erreur lors de la récupération des forfaits.';
            msg.reply(replyMessage);
          }
        }
      } else if (/^\d+$/.test(msg.body) && transactionSteps[msg.from]?.step !== 'ask_phone_number') {
        const allSubscriptionsResponse = await getAllSubscriptions();
        if (allSubscriptionsResponse.success) {
          const subscriptions = allSubscriptionsResponse.subscriptions;  
          const selectedForfaitIndex = parseInt(msg.body) - 1;
  
          if (selectedForfaitIndex >= 0 && selectedForfaitIndex < subscriptions.length) {
            const selectedForfait = subscriptions[selectedForfaitIndex];
  
            // Enregistrer l'étape de la transaction pour cet utilisateur
            transactionSteps[msg.from] = { step: 'ask_phone_number', selectedForfait };
  
            const phoneNumberMessage = 'Veuillez entrer votre numéro de téléphone pour la transaction Mobile Money (ex: 6xxxxxxxx):';
            msg.reply(phoneNumberMessage);
          } else {
            const invalidForfaitMessage = 'Le numéro de forfait sélectionné est invalide. Réessayez en fournissant un numéro valide.';
            msg.reply(invalidForfaitMessage);
          }
        }
      } else if (transactionSteps[msg.from]?.step === 'ask_phone_number') {
        let phoneNumber = msg.body.replace(/\s+/g, ''); // Supprimer les espaces
  
        // Ajouter le préfixe +237 si nécessaire
        if (!phoneNumber.startsWith('+237')) {
          phoneNumber = '+237' + phoneNumber;
        }
  
        // // Vérifier le format du numéro de téléphone
        if (/^(?:\+237)?6(?:9|8|7|5)\d{7}$/.test(phoneNumber)) {
          const allSubscriptionsResponse = await getAllSubscriptions();
          const subscriptions = allSubscriptionsResponse.subscriptions;
          const selectedForfait = transactionSteps[msg.from]?.selectedForfait;
  
          MonetBil.processPayment(msg, phoneNumber, selectedForfait, transactionSteps);
        }
        else if (/^(?:\+237)?6(?:6|2)\d{7}$/.test(phoneNumber)) {
          const invalidPhoneNumberMessage = 'Veuillez entrer uniquement un numéro MTN ou Orange.';
          msg.reply(invalidPhoneNumberMessage);
        } else {
          const invalidPhoneNumberMessage = 'Le numéro de téléphone est invalide. Veuillez saisir un numéro de téléphone au format valide (ex: 6xxxxxxxx).';
          msg.reply(invalidPhoneNumberMessage); 
        } 
      } else {
        const invalidRequestMessage = `Je ne comprends pas votre requête. Abonnez-vous dès maintenant en tapant *${subscribeKeyword}* pour accéder à nos prédictions premium.`;
        msg.reply(invalidRequestMessage); 
      }
};



module.exports = {
    UserCommander,
};
