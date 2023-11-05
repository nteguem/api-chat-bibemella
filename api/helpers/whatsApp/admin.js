const { findActiveSubscribers } = require("../../services/subscription.service");
const { sendMessageToNumber } = require("./whatsappMessaging");
const { createNotification } = require("../../services/notification.service");
const { getAllUser } = require("../../services/user.service");

const WELCOME_MESSAGE = `Salut %s,
En tant qu'administrateur de la Fondation Bibemella, voici les actions que vous pouvez effectuer :
1️⃣ Pour publier un enseignement, tapez 1.
2️⃣ Pour faire une annonce à tous, tapez 2.
0️⃣ Pour revenir au menu principal, tapez 0.

Nous attendons vos actions. Merci de votre engagement à la Fondation Bibemella ! 🙌`;
const ENSEIGNEMENTS_MESSAGE = "Entrez l'enseignement que vous souhaitez partager avec votre communauté";
const CONFIRM_MESSAGE_ENSEIGNEMENT = "Voici les enseignements que vous souhaitez envoyer a votre communauté :\n\n*%s*\n\nÊtes-vous sûr de vouloir les envoyer ? Répondez par 'Oui' pour confirmer.";
const CONFIRM_MESSAGE_ANNONCE = "Voici les enseignements que vous souhaitez envoyer a votre communauté :\n\n*%s*\n\nÊtes-vous sûr de vouloir les envoyer ? Répondez par 'Oui' pour confirmer.";
const SUCCESS_MESSAGE_ENSEIGNEMENTS =  "Les enseignements ont été envoyés à toute la communauté avec succès.";
const SUCCESS_MESSAGE_ANNONCE = "Les annonces ont été envoyées à toute la communauté avec succès." ;
const INVALID_REQUEST_MESSAGE = "Je ne comprends pas votre requête. Pour envoyer des enseignements saisir 1 , pour envoyer des conseils saisir 2";
const COMMAND_NAME = { ENSEIGNEMENTS: '1', ANNONCE: '2' };

const AdminCommander = async (client, msg, transactions) => {
    const contact = await msg.getContact();
    const sender = contact.pushname;
    if (!transactions[sender]) {
        msg.reply(WELCOME_MESSAGE.replace('%s', sender));
        transactions[sender] = {};
    } else {
        const userMessage = msg.body.toLowerCase();
        if (userMessage === COMMAND_NAME.ENSEIGNEMENTS) {
            msg.reply(ENSEIGNEMENTS_MESSAGE);
            transactions[sender].step = "enter_enseignements";
        } else if (transactions[sender].step === "enter_enseignements") {
            const enseignement = msg.body;
            msg.reply(CONFIRM_MESSAGE_ENSEIGNEMENT.replace('%s', enseignement));
            transactions[sender].step = "confirm_send_enseignement";
            transactions[sender].type = "Enseignement"; // Set the type
            transactions[sender].content = enseignement; // Store the enseignement content
        } else if (userMessage === COMMAND_NAME.ANNONCE) {
            msg.reply("Entrez l'annonce que vous souhaitez envoyer à votre communauté");
            transactions[sender].step = "enter_annonce";
        } else if (transactions[sender].step === "enter_annonce") {
            const annonce = msg.body;
            msg.reply(CONFIRM_MESSAGE_ANNONCE.replace('%s', annonce));
            transactions[sender].step = "confirm_send_annonce";
            transactions[sender].type = "Annonce"; // Set the type
            transactions[sender].content = annonce; // Store the announce content
        } else if (transactions[sender].step === "confirm_send_enseignement" && userMessage === "oui") {
            try {
                const activeSubscribers = await findActiveSubscribers();
                const content = `Cher utilisateur VIP, voici les ${transactions[sender].type} pour aujourd'hui :\n\n*${transactions[sender].content}* \n\n Bonne lecture !`;
                await createNotification({
                    sender: sender,
                    notifications: [
                        {
                            type: transactions[sender].type,
                            description: content
                        }
                    ]
                });

                for (const subscriber of activeSubscribers.data) {
                    await sendMessageToNumber(
                        client,
                        `${subscriber.phoneNumber}@c.us`,
                        content
                    );
                }

                msg.reply(SUCCESS_MESSAGE_ENSEIGNEMENTS);
            } catch (error) {
                console.error("Error sending messages:", error);
                msg.reply("Une erreur s'est produite lors de l'envoi des messages.");
            } finally {
                // Reset the transaction
                delete transactions[sender];
            }
        } else if (transactions[sender].step === "confirm_send_annonce" && userMessage === "oui") {
            try {
                const AllUsers = await getAllUser();
                const content = `Cher utilisateur, voici les ${transactions[sender].type} pour aujourd'hui :\n\n*${transactions[sender].content}* \n\n Bonne lecture !`;
                await createNotification({
                    sender: sender,
                    notifications: [
                        {
                            type: transactions[sender].type,
                            description: content
                        }
                    ]
                });

                for (const users of AllUsers.users) {
                    await sendMessageToNumber(
                        client,
                        `${users.phoneNumber}@c.us`,
                        content
                    );
                }

                msg.reply(SUCCESS_MESSAGE_ANNONCE);
            } catch (error) { 
                console.error("Error sending messages:", error);
                msg.reply("Une erreur s'est produite lors de l'envoi des messages.");
            } finally {
                // Reset the transaction
                delete transactions[sender];
            }
        }else {
            if (userMessage === '0') {
                msg.reply(WELCOME_MESSAGE.replace('%s', sender));
                delete transactions[sender];
            } else {
                msg.reply(INVALID_REQUEST_MESSAGE);
            }
        }
    }
};

module.exports = {
    AdminCommander,
};

