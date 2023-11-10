const { findActiveSubscribers } = require("../../services/subscription.service");
const { sendMessageToNumber } = require("./whatsappMessaging");
const { createNotification } = require("../../services/notification.service");
const { getAllTeachings } = require("../../services/teaching.service");
const { getAllUser } = require("../../services/user.service");
const { MessageMedia } = require('whatsapp-web.js');

const SUCCESS_MESSAGE_ENSEIGNEMENTS = "L'enseignement a été publié à toute la communauté avec succès.";
const SUCCESS_MESSAGE_ANNONCE = "L'annonce a été partagé à toute la communauté avec succès.";

const welcomeStatusUser = {};
const COMMAND_NAME = { ENSEIGNEMENTS: '1', ANNONCE: '2' };

const AdminCommander = async (client, msg, transactions) => {
    const contact = await msg.getContact();
    const sender = contact.pushname;
    const welcomeMessage = `🌍 Salut ${sender},
En tant qu'administrateur de la Fondation Bibemella, voici les actions que vous pouvez effectuer :
1️⃣ Pour publier un enseignement, tapez 1.
2️⃣ Pour faire une annonce à tous, tapez 2.
  
Nous attendons vos actions. Merci de votre engagement à la Fondation Bibemella ! 🙌`;

    const MenuPrincipal = `📚 Votre menu principal :

1️⃣ Pour publier un enseignement, tapez 1.
2️⃣ Pour faire une annonce à tous, tapez 2.

Nous attendons vos actions. Merci de votre engagement à la Fondation Bibemella ! 🙌`;

    if (!welcomeStatusUser[msg.from]) {
        // Envoyer le message de bienvenue la première fois
        msg.reply(welcomeMessage);

        // Enregistrer l'état de bienvenue pour cet utilisateur
        welcomeStatusUser[msg.from] = true;
    } else if (!msg.isGroupMsg) {
        const userResponse = msg.body.trim();

        if (userResponse === '#') {
            // Réinitialiser l'état de l'utilisateur et renvoyer le message de bienvenue
            delete transactions[msg.from];
            msg.reply(MenuPrincipal);
        } else if (userResponse === COMMAND_NAME.ENSEIGNEMENTS && !transactions[msg.from]) {
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
                transactions[msg.from] = { step: 'awaitTeachingType', type: 'ENSEIGNEMENTS', teachings };
            } else {
                const replyMessage = 'Erreur lors de la récupération des enseignements.';
                msg.reply(replyMessage);
            }
        } else if (transactions[msg.from] && transactions[msg.from].step === 'awaitTeachingType') {
            const userChoice = parseInt(userResponse);
            const teachings = transactions[msg.from].teachings;
            const selectedTeaching = teachings[userChoice - 1];
            const selectedTeachingChoice = teachings[userChoice - 1];

            // Vérifiez si le type contient des données dans l'objet "name"
            if (selectedTeaching.name.length === 0) {
                // Si l'objet "name" est vide, demandez à l'utilisateur s'il souhaite intégrer ce type
                msg.reply(`Entrez le contenu du ${selectedTeaching.type} que vous souhaitez partager avec votre communauté.`);
                transactions[msg.from].step = "pre_confirm_send_message";
                transactions[msg.from].selectedTeaching = selectedTeaching;
            } else {
                // Si l'objet "name" contient des données, affichez ces données à l'utilisateur avec des numéros pour chaque sous-option
                const teachingOptions = selectedTeachingChoice.name.map((teachingOption, index) => {
                    return `${index + 1}. ${teachingOption.nameTeaching}`;
                });
                const teachingOptionsMessage = `Choisissez un enseignement pour les ${selectedTeachingChoice.type} en entrant son numéro :\n${teachingOptions.join('\n')}
              \n*. Menu précédent\n#. Menu principal`;
                msg.reply(teachingOptionsMessage);

                // Attendez que l'utilisateur choisisse une sous-option et demandez-lui s'il souhaite intégrer cette sous-option
                transactions[msg.from].step = 'awaitSubTeachingChoice';
                transactions[msg.from].selectedTeachingChoice = selectedTeachingChoice;
            }
        } else if (transactions[msg.from] && transactions[msg.from].step === "pre_confirm_send_message") {
            const selectedTeaching = transactions[msg.from].selectedTeaching;
            const teachingMessage = userResponse; // Stockez la réponse de l'utilisateur dans une variable distincte
            if (teachingMessage = msg.body) {
                msg.reply(`Vous êtes sur le point de publier le ${selectedTeaching.type} suivant :\n\n*${teachingMessage}*\n\nRépondez par 'Oui' pour confirmer, 'Non' pour annuler.`);
            }
            if (teachingMessage = msg.hasMedia) {
                // Télécharger le média
                const media = await msg.downloadMedia();        
                // const targetUser = '237695592865@c.us'; // Remplacez par le numéro de l'utilisateur cible
                const mediaMessage = new MessageMedia(media.mimetype, media.data, media.filename);
                // await client.sendMessage(targetUser, mediaMessage);
                const replyMedia = `Vous êtes sur le point de publier le ${selectedTeaching.type} ci dessus`
                msg.reply(mediaMessage, {caption: replyMedia})
            }
            // msg.reply(`Vous êtes sur le point de publier le ${selectedTeaching.type} suivant :\n\n*${teachingMessage}*\n\nRépondez par 'Oui' pour confirmer, 'Non' pour annuler.`);

            transactions[msg.from].step = "confirm_publish_message";
            transactions[msg.from].selectedTeaching = selectedTeaching; // Stockez le message de l'enseignement dans une variable distincte
            transactions[msg.from].teachingMessage = teachingMessage;
        } else if (transactions[msg.from] && transactions[msg.from].step === "awaitSubTeachingChoice") {
            const teachingOptionNumber = parseInt(userResponse);
            const selectedTeachingChoice = transactions[msg.from].selectedTeachingChoice;

            if (teachingOptionNumber >= 1 && teachingOptionNumber <= selectedTeachingChoice.name.length) {
                const selectedTeachingOption = selectedTeachingChoice.name[teachingOptionNumber - 1];
                const TeachingDetailsMessage = `Entrez le ${transactions[msg.from].selectedTeachingChoice.type} ${selectedTeachingOption.nameTeaching} que vous souhaitez envoyer à votre communauté`;

                msg.reply(TeachingDetailsMessage);

                // Enregistrez l'étape de la transaction pour l'adhésion
                transactions[msg.from].step = 'pre_confirm_send_message_teaching';
                transactions[msg.from].selectedTeachingOption = selectedTeachingOption;
            } else if (userResponse === '*') {
                // L'utilisateur veut revenir à l'étape précédente
                const allTeachingsResponse = await getAllTeachings();
                const teachings = allTeachingsResponse.teachings;

                // Affichez les types d'enseignement à l'utilisateur avec des numéros
                const replyMessage = 'Choisissez un enseignement en répondant avec son numéro :\n' +
                    teachings.map((teaching, index) => {
                        return `${index + 1}. ${teaching.type}`;
                    }).join('\n');
                msg.reply(replyMessage + '\n\n#. Menu principal');
                transactions[msg.from].step = 'awaitTeachingType'
            } else {
                const invalidTeachingOptionMessage = 'Commande invalide. Veuillez entrer un numéro valide.';
                msg.reply(invalidTeachingOptionMessage);
            }
        } else if (transactions[msg.from] && transactions[msg.from].step === "pre_confirm_send_message_teaching") {
            const selectedTeachingChoice = transactions[msg.from].selectedTeachingChoice;
            const teachingMessageChoice = userResponse; // Stockez la réponse de l'utilisateur dans une variable distincte 
            const selectedTeachingOption = transactions[msg.from].selectedTeachingOption
            msg.reply(`Vous êtes sur le point de publier le ${selectedTeachingChoice.type} ${selectedTeachingOption.nameTeaching} suivant :\n\n*${teachingMessageChoice}*\n\nRépondez par 'Oui' pour confirmer, 'Non' pour annuler.`);

            transactions[msg.from].step = "confirm_publish_message_teaching";
            transactions[msg.from].selectedTeachingChoice = selectedTeachingChoice; // Stockez le message de l'enseignement dans une variable distincte
            transactions[msg.from].teachingMessageChoice = teachingMessageChoice;
        } else if (transactions[msg.from] && transactions[msg.from].step === "confirm_publish_message" && userResponse.toLowerCase() === "oui") {
            // L'utilisateur a confirmé, gérer l'envoi
            const selectedTeaching = transactions[msg.from].selectedTeaching;
            const teachingMessage = transactions[msg.from].teachingMessage; // This is the message entered by the user

            // Define the content for the message
            const content = `Cher utilisateur VIP, voici le ${selectedTeaching.type} pour aujourd'hui :\n\n*${teachingMessage}* \n\n Bonne lecture !`;

            // Implement the logic for sending the message here (you can use the sendMessageToNumber function)
            try {
                const activeSubscribers = await findActiveSubscribers();

                // Create a notification
                await createNotification({
                    sender: sender,
                    notifications: [
                        {
                            type: selectedTeaching.type,
                            description: content
                        }
                    ]
                });

                // Send the message to each subscriber
                for (const subscriber of activeSubscribers.data) {
                    // Implement the logic for sending messages to subscribers
                    await sendMessageToNumber(client, `${subscriber.phoneNumber}@c.us`, content);
                }

                // Send a success message to the user
                msg.reply(SUCCESS_MESSAGE_ENSEIGNEMENTS);
            } catch (error) {
                console.error("Error sending messages:", error);
                msg.reply("Une erreur s'est produite lors de l'envoi des messages.");
            } finally {
                // Reset the transaction
                delete transactions[msg.from];
            }
        } else if (transactions[msg.from] && transactions[msg.from].step === "confirm_publish_message_teaching" && userResponse.toLowerCase() === "oui") {
            // L'utilisateur a confirmé, gérer l'envoi
            const selectedTeachingChoice = transactions[msg.from].selectedTeachingChoice;
            const teachingMessageChoice = transactions[msg.from].teachingMessageChoice; // This is the message entered by the user
            const selectedTeachingOption = transactions[msg.from].selectedTeachingOption

            // Define the content for the message
            const content = `Cher utilisateur VIP, voici le ${selectedTeachingChoice.type} ${selectedTeachingOption.nameTeaching} pour aujourd'hui :\n\n*${teachingMessageChoice}* \n\n Bonne lecture !`;

            // Implement the logic for sending the message here (you can use the sendMessageToNumber function)
            try {
                const activeSubscribers = await findActiveSubscribers();

                // Create a notification
                await createNotification({
                    sender: sender,
                    notifications: [
                        {
                            type: selectedTeachingChoice.type,
                            description: content
                        }
                    ]
                });

                // Send the message to each subscriber
                for (const subscriber of activeSubscribers.data) {
                    // Implement the logic for sending messages to subscribers
                    await sendMessageToNumber(client, `${subscriber.phoneNumber}@c.us`, content);
                }

                // Send a success message to the user
                msg.reply(SUCCESS_MESSAGE_ENSEIGNEMENTS);
                msg.reply(MenuPrincipal);
            } catch (error) {
                console.error("Error sending messages:", error);
                msg.reply("Une erreur s'est produite lors de l'envoi des messages.");
            } finally {
                // Reset the transaction
                delete transactions[msg.from];
                msg.reply(MenuPrincipal);
            }
        } else if (userResponse === COMMAND_NAME.ANNONCE && !transactions[msg.from]) {
            transactions[msg.from] = {};
            msg.reply(`Entrez le contenu de l'annonce que vous souhaitez partager avec votre communauté.`);
            transactions[msg.from].step = "enter_annonce";
        } else if (transactions[msg.from] && transactions[msg.from].step === "enter_annonce") {
            const annonce = userResponse; // Stockez la réponse de l'utilisateur dans une variable distincte 
            msg.reply(`Vous êtes sur le point de publier l'annonce suivant :\n\n*${annonce}*\n\nRépondez par 'Oui' pour confirmer, 'Non' pour annuler.`);

            transactions[msg.from].step = "confirm_send_annonce";
            transactions[msg.from].type = "Annonce";
            transactions[msg.from].annonce = annonce;
        } else if (transactions[msg.from] && transactions[msg.from].step === "confirm_send_annonce" && userResponse === "oui") {
            try {
                const AllUsers = await getAllUser();
                const annonce = transactions[msg.from].annonce;
                const content = `Cher utilisateur, \n\n*${annonce}* \n\n Bonne lecture !`;
                await createNotification({
                    sender: sender,
                    notifications: [
                        {
                            type: transactions[msg.from].type,
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
                msg.reply(MenuPrincipal);
            } catch (error) {
                console.error("Error sending messages:", error);
                msg.reply("Une erreur s'est produite lors de l'envoi des messages.");
            } finally {
                // Reset the transaction
                delete transactions[msg.from];
            }
        } else {
            // Gérer d'autres cas d'utilisation ou afficher un message d'erreur
            delete transactions[msg.from];
            msg.reply(MenuPrincipal);
        }
    }
};

module.exports = {
    AdminCommander,
};