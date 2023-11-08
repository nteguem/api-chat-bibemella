const { findActiveSubscribers } = require("../../services/subscription.service");
const { sendMessageToNumber } = require("./whatsappMessaging");
const { createNotification } = require("../../services/notification.service");
const { getAllUser } = require("../../services/user.service");
const { getAllTeachings } = require("../../services/teaching.service");

const WELCOME_MESSAGE = `Salut %s,
En tant qu'administrateur de la Fondation Bibemella, voici les actions que vous pouvez effectuer :
1️⃣ Pour publier un enseignement, tapez 1.
2️⃣ Pour faire une annonce à tous, tapez 2.
0️⃣ Pour revenir au menu principal, tapez 0.

Nous attendons vos actions. Merci de votre engagement à la Fondation Bibemella ! 🙌`;

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
            const allTeachingsResponse = await getAllTeachings();
    
            if (allTeachingsResponse.success) {
                const enseignements = allTeachingsResponse.teachings;
                transactions[sender].enseignements = enseignements;  // Sauvegardez les enseignements dans la transaction
                const replyMessage = 'Choisissez un enseignement en répondant avec son numéro :\n' +
                    enseignements.map((enseignement, index) => {
                        return `${index + 1}. ${enseignement.type}`;
                    }).join('\n');
                msg.reply(replyMessage);
    
                transactions[sender].step = "select_enseignement";
            } else {
                const replyMessage = 'Erreur lors de la récupération des enseignements.';
                msg.reply(replyMessage);
            }
        } else if (transactions[sender].step === "select_enseignement") {
            const selectedOption = parseInt(userMessage);
            const enseignements = transactions[sender].enseignements;
            const selectedEnseignement = enseignements[selectedOption - 1];
    
            if (selectedEnseignement.name.length > 0) {
                const enseignementOptions = selectedEnseignement.name.map((enseignementOption, index) => {
                    return `${index + 1}. ${enseignementOption.nameTeaching}`;
                });
    
                const enseignementOptionsMessage = `Choisissez un enseignement pour les ${selectedEnseignement.type} en entrant son numéro :\n${enseignementOptions.join('\n')}`;
                msg.reply(enseignementOptionsMessage);
    
                transactions[sender].step = 'select_sous_option';
                transactions[sender].selectedEnseignement = selectedEnseignement;
            } else {
                // L'enseignement n'a pas de sous-options, proposez d'envoyer un message de masse
                msg.reply(`Entrez le ${selectedEnseignement.type} que vous souhaitez envoyer à votre communauté`);
                transactions[sender].step = 'pre_confirm_send_message';
                transactions[sender].selectedEnseignement = selectedEnseignement;
            }
        } else if (transactions[sender].step === 'pre_confirm_send_message') {
            const selectedEnseignement = transactions[sender].selectedEnseignement;
            transactions[sender].selectedEnseignementMessage = msg.body;
            msg.reply(`Vous êtes sur le point de publier le ${selectedEnseignement.type} suivant :\n\n*${transactions[sender].selectedEnseignementMessage}*\n\nRépondez par 'Oui' pour confirmer, 'Non' pour annuler.`);

            transactions[sender].step = 'confirm_publish_message';
        } else if (transactions[sender].step === 'confirm_publish_message') {
            const selectedEnseignement = transactions[sender].selectedEnseignement;
            const userMessage = msg.body;

            if (userMessage.toLowerCase() === 'oui') {
                try {
                    const activeSubscribers = await findActiveSubscribers();
                    const content = `Cher utilisateur VIP, voici les ${selectedEnseignement.type} pour aujourd'hui :\n\n*${transactions[sender].selectedEnseignementMessage}* \n\n Bonne lecture !`;

                    await createNotification({
                        sender: sender,
                        notifications: [
                            {
                                type: selectedEnseignement.type,
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
            } else if (userMessage.toLowerCase() === 'non') {
                msg.reply("La publication a été annulée.");
                // Reset the transaction
                delete transactions[sender];
            } else {
                msg.reply("Répondez par 'Oui' pour confirmer, 'Non' pour annuler.");
            }
        } else if (userMessage === COMMAND_NAME.ANNONCE) {
            msg.reply("Entrez l'annonce que vous souhaitez envoyer à votre communauté");
            transactions[sender].step = "enter_annonce";
        } else if (transactions[sender].step === "enter_annonce") {
            const annonce = msg.body;
            msg.reply(CONFIRM_MESSAGE_ANNONCE.replace('%s', annonce));
            transactions[sender].step = "confirm_send_annonce";
            transactions[sender].type = "Annonce"; // Set the type
            transactions[sender].content = annonce; // Store the announce content
        } else if (transactions[sender].step === "confirm_send_annonce") {
            // User has confirmed to send the announcement, you can handle it here
            if (userMessage.toLowerCase() === 'oui') {
                try {
                    const allUsers = await getAllUser();
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

                    for (const users of allUsers.users) {
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
            } else if (userMessage.toLowerCase() === 'non') {
                msg.reply("L'envoi de l'annonce a été annulé.");
                // Reset the transaction
                delete transactions[sender];
            } else {
                msg.reply("Répondez par 'Oui' pour confirmer, 'Non' pour annuler.");
            }
        } else {
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
