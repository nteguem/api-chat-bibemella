const { findActiveSubscribers } = require("../../services/subscription.service");
const { sendMessageToNumber } = require("./whatsappMessaging");
const WELCOME_MESSAGE = "Bonjour %s, comment puis-je vous aider aujourd'hui ? Vous pouvez saisir *predire* pour envoyer les pronostics aux utilisateurs VIP.";
const PREDICT_MESSAGE = "Entrez les pronostics du jour que vous souhaitez envoyer aux utilisateurs VIP.";
const CONFIRM_MESSAGE = "Voici les pronostics que vous souhaitez envoyer aux utilisateurs VIP :\n\n*%s*\n\nÊtes-vous sûr de vouloir les envoyer ? Répondez par 'Oui' pour confirmer.";
const SUCCESS_MESSAGE = "Les pronostics ont été envoyés à tous les utilisateurs VIP avec succès.";
const INVALID_REQUEST_MESSAGE = "Je ne comprends pas votre requête. Pour envoyer des pronostics VIP, saisissez *predire* pour commencer.";
const COMMAND_NAME =  { PREDIRE :'predire'};

const AdminCommander = async (client, msg, transactions) => {
    const sender = msg.from;
    if (!transactions[sender]) {
        msg.reply(WELCOME_MESSAGE.replace('%s', sender));
        transactions[sender] = {};
    } else {
   
    }
};

module.exports = {
    AdminCommander,
};
