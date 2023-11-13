const { sendMessageToNumber } = require("./whatsappMessaging");
const { createNotification } = require("../../services/notification.service");
const { getAllUser } = require("../../services/user.service");
const { MessageMedia } = require('whatsapp-web.js');
const { getAllProducts, findActiveSubscribers } = require("../../services/product.service");

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
            const allServices = await getAllProducts("service");
            if (allServices.success) {
                const services = allServices.products;

                // Affichez les types d'enseignement à l'utilisateur avec des numéros
                const replyMessage = 'Choisissez un enseignement en répondant avec son numéro :\n' +
                    services.map((service, index) => {
                        return `${index + 1}. ${service.name}`;
                    }).join('\n');
                msg.reply(replyMessage + '\n\n#. Menu principal');

                // Enregistrez l'étape de la transaction pour cet utilisateur
                transactions[msg.from] = { step: 'awaitTeachingType', type: 'ENSEIGNEMENTS', services };
            } else {
                const replyMessage = 'Erreur lors de la récupération des enseignements.';
                msg.reply(replyMessage);
            }
        } else if (transactions[msg.from] && transactions[msg.from].step === 'awaitTeachingType') {
            const userChoice = parseInt(userResponse);
            const services = transactions[msg.from].services;
            const selectedService = services[userChoice - 1];
            const selectedServiceChoice = services[userChoice - 1];

            // Vérifiez si le type contient des données dans l'objet "name"
            if (!selectedService.hasSub) {
                // Si l'objet "name" est vide, demandez à l'utilisateur s'il souhaite intégrer ce type
                msg.reply(`Entrez le contenu du ${selectedService.name} que vous souhaitez partager avec votre communauté.`);
                transactions[msg.from].step = "pre_confirm_send_message";
                transactions[msg.from].selectedService = selectedService;
            } else {
                // Si l'objet "name" contient des données, affichez ces données à l'utilisateur avec des numéros pour chaque sous-option
                const serviceOptions = selectedServiceChoice.subservices.map((serviceOption, index) => {
                    return `${index + 1}. ${serviceOption.name}`;
                });
                const serviceOptionsMessage = `Choisissez un enseignement pour les ${selectedServiceChoice.name} 
                en entrant son numéro :\n${serviceOptions.join('\n')}
              \n*. Menu précédent\n#. Menu principal`;
                msg.reply(serviceOptionsMessage);

                // Attendez que l'utilisateur choisisse une sous-option et demandez-lui s'il souhaite intégrer cette sous-option
                transactions[msg.from].step = 'awaitSubTeachingChoice';
                transactions[msg.from].selectedServiceChoice = selectedServiceChoice;
            }
        } else if (transactions[msg.from] && transactions[msg.from].step === "pre_confirm_send_message") {
            const selectedService = transactions[msg.from].selectedService;
            const serviceMessage = userResponse; // Stockez la réponse de l'utilisateur dans une variable distincte 
            const activeSubscribers = await findActiveSubscribers();
            if (activeSubscribers.success) {
                const users = activeSubscribers.activeSubscribers;
                if (msg.hasMedia) {
                    // Télécharger le média
                    const media = await msg.downloadMedia();
                    const targetUser = `${users.phoneNumber}@c.us`; // Replace with the actual index or logic to select a user
                    console.log(targetUser);
                    const mediaMessage = new MessageMedia(media.mimetype, media.data, media.filename);
                    await client.sendMessage(targetUser, mediaMessage);
                }
            }

            msg.reply(`Vous êtes sur le point de publier le ${selectedService.name} suivant :\n\n*${serviceMessage}*\n\nRépondez par 'Oui' pour confirmer, 'Non' pour annuler.`);

            transactions[msg.from].step = "confirm_publish_message";
            transactions[msg.from].selectedService = selectedService; // Stockez le message de l'enseignement dans une variable distincte
            transactions[msg.from].serviceMessage = serviceMessage;
        } else if (transactions[msg.from] && transactions[msg.from].step === "awaitSubTeachingChoice") {
            const teachingOptionNumber = parseInt(userResponse);

            if (teachingOptionNumber >= 1 && teachingOptionNumber <= selectedServiceChoice.subservices.length) {
                const selectedServiceOption = selectedServiceChoice.subservices[teachingOptionNumber - 1];
                const TeachingDetailsMessage = `Entrez le ${transactions[msg.from].selectedServiceOption.category} ${selectedServiceOption.name} que vous souhaitez envoyer à votre communauté`;

                msg.reply(TeachingDetailsMessage);

                // Enregistrez l'étape de la transaction pour l'adhésion
                transactions[msg.from].step = 'pre_confirm_send_message_teaching';
                transactions[msg.from].selectedServiceOption = selectedServiceOption;
            } else if (userResponse === '*') {
                // L'utilisateur veut revenir à l'étape précédente
                const allServices = await getAllProducts("service");
                const services = allServices.products;

                // Affichez les types d'enseignement à l'utilisateur avec des numéros
                const replyMessage = 'Choisissez un enseignement en répondant avec son numéro :\n' +
                    services.map((service, index) => {
                        return `${index + 1}. ${service.name}`;
                    }).join('\n');
                msg.reply(replyMessage + '\n\n#. Menu principal');
                transactions[msg.from].step = 'awaitTeachingType'
            } else {
                const invalidTeachingOptionMessage = 'Commande invalide. Veuillez entrer un numéro valide.';
                msg.reply(invalidTeachingOptionMessage);
            }
        } else if (transactions[msg.from] && transactions[msg.from].step === "pre_confirm_send_message_teaching") {
            const teachingMessageChoice = userResponse; // Stockez la réponse de l'utilisateur dans une variable distincte 
            const selectedServiceOption = transactions[msg.from].selectedServiceOption
            msg.reply(`Vous êtes sur le point de publier le ${selectedServiceOption.category} ${selectedServiceOption.name} ci-dessous :\n\n*${teachingMessageChoice}*\n\nRépondez par 'Oui' pour confirmer, 'Non' pour annuler.`);

            transactions[msg.from].step = "confirm_publish_message_teaching";
            transactions[msg.from].teachingMessageChoice = teachingMessageChoice;
        } else if (transactions[msg.from] && transactions[msg.from].step === "confirm_publish_message" && userResponse.toLowerCase() === "oui") {
            // L'utilisateur a confirmé, gérer l'envoi
            const selectedService = transactions[msg.from].selectedService;
            const serviceMessage = transactions[msg.from].serviceMessage; // This is the message entered by the user

            // Define the content for the message
            const content = `Cher utilisateur VIP, voici le ${selectedService.name} pour aujourd'hui :\n\n*${serviceMessage}* \n\n Bonne lecture !`;

            // Implement the logic for sending the message here (you can use the sendMessageToNumber function)
            try {
                const activeSubscribers = await findActiveSubscribers(false, selectedService._id);

                // Create a notification
                await createNotification({
                    sender: sender,
                    notifications: [
                        {
                            type: selectedService.name,
                            description: content
                        }
                    ]
                });

                // Send the message to each subscriber
                for (const activeSubscriber of activeSubscribers.activeSubscribers) {
                    if (activeSubscribers.activeSubscribers.subscription === 'false') {
                        // Implement the logic for sending messages to subscribers
                        await sendMessageToNumber(client, `${activeSubscriber.phoneNumber}@c.us`, content);
                    }
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
            }
        } else if (transactions[msg.from] && transactions[msg.from].step === "confirm_publish_message_teaching" && userResponse.toLowerCase() === "oui") {
            // L'utilisateur a confirmé, gérer l'envoi
            const teachingMessageChoice = transactions[msg.from].teachingMessageChoice; // This is the message entered by the user
            const selectedServiceOption = transactions[msg.from].selectedServiceOption

            // Define the content for the message
            const content = `Cher utilisateur VIP, voici le ${selectedServiceOption.category} ${selectedServiceOption.name} pour aujourd'hui :\n\n*${teachingMessageChoice}* \n\n Bonne lecture !`;

            // Implement the logic for sending the message here (you can use the sendMessageToNumber function)
            try {
                const AllUsers = await findActiveSubscribers(true, selectedServiceOption._id);

                // Create a notification
                await createNotification({
                    sender: sender,
                    notifications: [
                        {
                            type: selectedServiceOption.category,
                            description: content
                        }
                    ]
                });

                // Send the message to each subscriber
                for (const users of AllUsers.users) {
                    // Implement the logic for sending messages to subscribers
                    await sendMessageToNumber(client, `${users.phoneNumber}@c.us`, content);
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
        } else if (transactions[msg.from] && transactions[msg.from].step === "confirm_send_annonce" && userResponse.toLowerCase() === "oui") {
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