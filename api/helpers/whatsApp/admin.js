const { sendMessageToNumber } = require("./whatsappMessaging");
const { createNotification } = require("../../services/notification.service");
const { getAllUser } = require("../../services/user.service");
const { MessageMedia } = require("whatsapp-web.js");
const {
  getAllProducts,
  findActiveSubscribers,
} = require("../../services/product.service");
const {
  getTotalSuccessAmount,
} = require("../../services/totalTransaction.service");

const SUCCESS_MESSAGE_ENSEIGNEMENTS =
  "L'enseignement a été publié à toute la communauté avec succès.";
const SUCCESS_MESSAGE_ANNONCE =
  "L'annonce a été partagé à toute la communauté avec succès.";

const welcomeStatusUser = {};
const COMMAND_NAME = { ENSEIGNEMENTS: "1", ANNONCE: "2", SOLDE: "3" };

const AdminCommander = async (client, msg, transactions) => {
  const contact = await msg.getContact();
  const sender = contact.pushname;
  const welcomeMessage = `🌍 Salut ${sender},
En tant qu'administrateur de la Fondation Bibemella, voici les actions que vous pouvez effectuer :
1️⃣ Pour publier un enseignement, tapez 1.
2️⃣ Pour faire une annonce à tous, tapez 2.
3️⃣ Pour consulter le solde de tous les transactions, tapez 3.
  
Nous attendons vos actions. Merci de votre engagement à la Fondation Bibemella ! 🙌`;

  const MenuPrincipal = `📚 Votre menu principal :

1️⃣ Pour publier un enseignement, tapez 1.
2️⃣ Pour faire une annonce à tous, tapez 2.
3️⃣ Pour consulter le solde de tous les transactions, tapez 3.

Nous attendons vos actions. Merci de votre engagement à la Fondation Bibemella ! 🙌`;

  if (!welcomeStatusUser[msg.from]) {
    // Envoyer le message de bienvenue la première fois
    msg.reply(welcomeMessage);

    // Enregistrer l'état de bienvenue pour cet utilisateur
    welcomeStatusUser[msg.from] = true;
  } else if (!msg.isGroupMsg) {
    const userResponse = msg.body.trim();

    if (userResponse === "#") {
      // Réinitialiser l'état de l'utilisateur et renvoyer le message de bienvenue
      delete transactions[msg.from];
      msg.reply(MenuPrincipal);
    } else if (
      userResponse === COMMAND_NAME.ENSEIGNEMENTS &&
      !transactions[msg.from]
    ) {
      const allServices = await getAllProducts("service");
      if (allServices.success) {
        const services = allServices.products;

        // Affichez les types d'enseignement à l'utilisateur avec des numéros
        const replyMessage =
          "Choisissez un enseignement en répondant avec son numéro :\n" +
          services
            .map((service, index) => {
              return `${index + 1}. ${service.name}`;
            })
            .join("\n");
        msg.reply(replyMessage + "\n\n#. Menu principal");

        // Enregistrez l'étape de la transaction pour cet utilisateur
        transactions[msg.from] = {
          step: "awaitTeachingType",
          type: "ENSEIGNEMENTS",
          services,
        };
      } else {
        const replyMessage =
          "Erreur lors de la récupération des enseignements.";
        msg.reply(replyMessage);
      }
    } else if (
      transactions[msg.from] &&
      transactions[msg.from].step === "awaitTeachingType"
    ) {
      const userChoice = parseInt(userResponse);
      const services = transactions[msg.from].services;
      const selectedService = services[userChoice - 1];
      const selectedServiceChoice = services[userChoice - 1];

      // Vérifiez si le type contient des données dans l'objet "name"
      if (!selectedService.hasSub) {
        // Si l'objet "name" est vide, demandez à l'utilisateur s'il souhaite intégrer ce type
        msg.reply(
          `Entrez le contenu du ${selectedService.name} que vous souhaitez partager avec votre communauté.`
        );
        transactions[msg.from].step = "pre_confirm_send_message";
        transactions[msg.from].selectedService = selectedService;
      } else {
        // Si l'objet "name" contient des données, affichez ces données à l'utilisateur avec des numéros pour chaque sous-option
        const serviceOptions = selectedServiceChoice.subservices.map(
          (serviceOption, index) => {
            return `${index + 1}. ${serviceOption.name}`;
          }
        );
        const serviceOptionsMessage = `Choisissez un enseignement pour les ${
          selectedServiceChoice.name
        } 
                en entrant son numéro :\n${serviceOptions.join("\n")}
              \n*. Menu précédent\n#. Menu principal`;
        msg.reply(serviceOptionsMessage);

        // Attendez que l'utilisateur choisisse une sous-option et demandez-lui s'il souhaite intégrer cette sous-option
        transactions[msg.from].step = "awaitSubTeachingChoice";
        transactions[msg.from].selectedService = selectedServiceChoice;
      }
    } else if (
      transactions[msg.from] &&
      transactions[msg.from].step === "pre_confirm_send_message"
    ) {
      const selectedService = transactions[msg.from].selectedService;
      const serviceMessage = userResponse; // Stockez la réponse de l'utilisateur dans une variable distincte

      let opId = selectedService.hasSub
        ? transactions[msg.from].selectedServiceOption._id
        : selectedService._id;
      const activeSubscribers = await findActiveSubscribers(
        selectedService.hasSub,
        opId
      );
      if (activeSubscribers.success) {
        const users = activeSubscribers.activeSubscribers;
        transactions[msg.from].users = users;
        if (msg.hasMedia) {
          const media = await msg.downloadMedia();
          const mediaMessage = new MessageMedia(
            media.mimetype,
            media.data,
            media.filename
          );
          transactions[msg.from].mediaMessage = mediaMessage;
        }
      }

      msg.reply(
        `Vous êtes sur le point de publier le ${selectedService.name} suivant :\n\n*${serviceMessage}*\n\nRépondez par 'Oui' pour confirmer, 'Non' pour annuler.`
      );

      transactions[msg.from].step = "confirm_publish_message";
      transactions[msg.from].selectedService = selectedService; // Stockez le message de l'enseignement dans une variable distincte
      transactions[msg.from].serviceMessage = serviceMessage;
    } else if (
      transactions[msg.from] &&
      transactions[msg.from].step === "awaitSubTeachingChoice"
    ) {
      const teachingOptionNumber = parseInt(userResponse);
      const selectedServiceChoice = transactions[msg.from].selectedService;

      if (
        teachingOptionNumber >= 1 &&
        teachingOptionNumber <= selectedServiceChoice.subservices.length
      ) {
        const selectedServiceOption =
          selectedServiceChoice.subservices[teachingOptionNumber - 1];
        const TeachingDetailsMessage = `Entrez le ${selectedServiceOption.category} ${selectedServiceOption.name} que vous souhaitez envoyer à votre communauté`;

        msg.reply(TeachingDetailsMessage);

        // Enregistrez l'étape de la transaction pour l'adhésion
        transactions[msg.from].step = "pre_confirm_send_message";
        transactions[msg.from].selectedServiceOption = selectedServiceOption;
      } else if (userResponse === "*") {
        // L'utilisateur veut revenir à l'étape précédente
        const allServices = await getAllProducts("service");
        const services = allServices.products;

        // Affichez les types d'enseignement à l'utilisateur avec des numéros
        const replyMessage =
          "Choisissez un enseignement en répondant avec son numéro :\n" +
          services
            .map((service, index) => {
              return `${index + 1}. ${service.name}`;
            })
            .join("\n");
        msg.reply(replyMessage + "\n\n#. Menu principal");
        transactions[msg.from].step = "awaitTeachingType";
      } else {
        const invalidTeachingOptionMessage =
          "Commande invalide. Veuillez entrer un numéro valide.";
        msg.reply(invalidTeachingOptionMessage);
      }
    } else if (
      transactions[msg.from] &&
      transactions[msg.from].step === "confirm_publish_message" &&
      userResponse.toLowerCase() === "oui"
    ) {
      // L'utilisateur a confirmé, gérer l'envoi
      const selectedService = transactions[msg.from].selectedService;
      const serviceMessage = transactions[msg.from].serviceMessage; // This is the message entered by the user
      const users = transactions[msg.from].users;
      let servName = selectedService.hasSub
        ? selectedService.name +
          ": " +
          `*${transactions[msg.from]?.selectedServiceOption.name}*`
        : selectedService.name;

      if (transactions[msg.from].mediaMessage) {
        // Define the content for the message

        const mediaMessage = transactions[msg.from].mediaMessage;
        users.forEach(async (targetUser) => {
          try {
            // Send the media message
            const content = `Cher ${targetUser.name}, voici le ${servName} pour aujourd'hui. \n\n Bonne lecture !`;
            await client.sendMessage(
              `${targetUser.phoneNumber}@c.us`,
              mediaMessage,
              { caption: content }
            );
          } catch (error) {
            msg.reply(`Erreur lors de l'envoi du contenu media`);
          }
        });
      } else {
        const content = `Cher ${targetUser.name}, voici le ${servName} pour aujourd'hui :\n\n*${serviceMessage}* \n\n Bonne lecture !`;
        users.forEach(async (targetUser) => {
          try {
            // Send the media message
            await sendMessageToNumber(
              client,
              `${targetUser.phoneNumber}@c.us`,
              content
            );
          } catch (error) {
            msg.reply(`Erreur lors de l'envoi du contenu media`);
          }
        });
      }

      msg.reply(SUCCESS_MESSAGE_ENSEIGNEMENTS);
      msg.reply(MenuPrincipal);

      delete transactions[msg.from];
    } else if (
      userResponse === COMMAND_NAME.ANNONCE &&
      !transactions[msg.from]
    ) {
      transactions[msg.from] = {};
      msg.reply(
        `Entrez le contenu de l'annonce que vous souhaitez partager avec votre communauté.`
      );
      transactions[msg.from].step = "enter_annonce";
    } else if (
      transactions[msg.from] &&
      transactions[msg.from].step === "enter_annonce"
    ) {
      const annonce = userResponse; // Stockez la réponse de l'utilisateur dans une variable distincte
      msg.reply(
        `Vous êtes sur le point de publier l'annonce suivant :\n\n*${annonce}*\n\nRépondez par 'Oui' pour confirmer, 'Non' pour annuler.`
      );

      transactions[msg.from].step = "confirm_send_annonce";
      transactions[msg.from].type = "Annonce";
      transactions[msg.from].annonce = annonce;
    } else if (
      transactions[msg.from] &&
      transactions[msg.from].step === "confirm_send_annonce" &&
      userResponse.toLowerCase() === "oui"
    ) {
      try {
        const AllUsers = await getAllUser();
        const annonce = transactions[msg.from].annonce;
        const content = `Cher utilisateur, \n\n*${annonce}* \n\n Bonne lecture !`;
        await createNotification({
          sender: sender,
          notifications: [
            {
              type: transactions[msg.from].type,
              description: content,
            },
          ],
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
        msg.reply("Une erreur s'est produite lors de l'envoi des messages.");
      } finally {
        // Reset the transaction
        delete transactions[msg.from];
      }
    } else if (userResponse === COMMAND_NAME.SOLDE && !transactions[msg.from]) {
      //consulter le solde
      const resultTotal = await getTotalSuccessAmount();
      if (resultTotal.success) {
        
        let amount = resultTotal.totalAmount[0].amount;
        let num = resultTotal.totalAmount[0].number;
        let amountMessage =
          "Le solde total de tous les transactions effectuées est de: " +
          `*${amount} FCFA*\n\n` +
          "Nombre de transaction: " +
          `*${num}*\n` +
          "\n\n#. Menu principal";
          delete transactions[msg.from];
          msg.reply(amountMessage);
      }else{
        msg.reply("Une erreur s'est produite lors de la recuperation du solde");
      }
    } else {
      delete transactions[msg.from];
      msg.reply(MenuPrincipal);
    }
  }
};

module.exports = {
  AdminCommander,
};
