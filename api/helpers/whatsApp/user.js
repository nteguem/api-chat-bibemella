const axios = require("axios");
const MonetBil = require("../MonetBil");
require("dotenv").config(); // Charger les variables d'environnement depuis le fichier .env
const { updateUser } = require("../../services/user.service");
const { welcomeData, menuData } = require("../../data");
const { getAllProducts } = require("../../services/product.service");
const { getAllUserSubscriptions } = require("../../services/product.service");
const {
  addMessageToConversation,
  getAllConversations,
} = require("../../services/conversation.service");
const chatCompletion = require("../chatCompletion");
const generatePDFBuffer = require("../pdfGenerator");
const { sendMediaToNumber } = require("./whatsappMessaging");
const moment = require("moment");
const simulateTyping = require("../sendReplyState");
const { getAllEvents } = require("../../services/events.service");
const { MessageMedia } = require("whatsapp-web.js");

const welcomeStatusUser = {};
const transactionSteps = {};

const COMMAND_NAME = {
  ENSEIGNEMENTS: "1",
  NFT: "2",
  WELLNESS: "3",
  IA: "4",
  PRODUITS: "5",
  EVENTS: "6",
};

const UserCommander = async (client, msg) => {
  const contact = await msg.getContact();
  const welcomeMessage = welcomeData(contact.pushname);

  const MenuPrincipal = menuData();

  if (!welcomeStatusUser[msg.from]) {
    // Envoyer le message de bienvenue la première fois
    msg.reply(welcomeMessage);

    // Enregistrer l'état de bienvenue pour cet utilisateur
    welcomeStatusUser[msg.from] = true;
  } else if (!msg.isGroupMsg) {
    const userResponse = msg.body.trim();

    if (userResponse === "#") {
      // Réinitialiser l'état de l'utilisateur et renvoyer le message de bienvenue
      delete transactionSteps[msg.from];
      msg.reply(MenuPrincipal);
    } else if (userResponse.toLowerCase() === "ejara") {
      transactionSteps[msg.from] = {};
      msg.reply(
        "Possédez-vous un compte Ejara?\n\nRepondez par 'oui' ou 'non'"
      );

      transactionSteps[msg.from].step = "ask-ejara-account";
    } else if (
      transactionSteps[msg.from] &&
      transactionSteps[msg.from].step === "ask-ejara-account"
    ) {
      const userResponseEjara = userResponse.toLowerCase();

      if (userResponseEjara === "oui") {
        // Le client a confirmé l'achat, continuez avec les options de paiement.
        const ejaraName = "*Veuillez renseigner votre nom d'utilisateur Ejara*";
        msg.reply(ejaraName);

        transactionSteps[msg.from].step = "ask-ejara-name";
        transactionSteps[msg.from].ejaraName = ejaraName;
      } else if (userResponseEjara === "non") {
        // Redirigez l'utilisateur vers le choix du type d'enseignement
        delete transactionSteps[msg.from];
        msg.reply(MenuPrincipal);
      }
    } else if (
      transactionSteps[msg.from] &&
      transactionSteps[msg.from].step === "ask-ejara-name"
    ) {
      const ejaraNameResponse = userResponse;
      const phoneNumber = msg.from;
      let cleanedPhoneNumber = phoneNumber.replace(/@c\.us$/, "");
      const userUpdated = await updateUser(cleanedPhoneNumber, {
        username_ejara: ejaraNameResponse,
      });
      if (userUpdated.success) {
        msg.reply(`Votre nom d'utilisateur Ejara a été ajouté avec succès.`);
        delete transactionSteps[msg.from];
      } else {
        msg.reply(
          `Erreur lors de l'ajout du nom d'utilisateur Ejara, réessayez ultérieurement.`
        );
        delete transactionSteps[msg.from];
      }
    } else if (
      userResponse === COMMAND_NAME.ENSEIGNEMENTS &&
      !transactionSteps[msg.from]
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
        transactionSteps[msg.from] = {
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
      transactionSteps[msg.from] &&
      transactionSteps[msg.from].step === "awaitTeachingType"
    ) {
      const userChoice = parseInt(userResponse);
      const services = transactionSteps[msg.from].services;
      const selectedService = services[userChoice - 1];

      // Vérifiez si le type contient des données dans le sous-type
      if (!selectedService.hasSub) {
        // Si l'objet n'a pas de sous-type
        msg.reply(
          `*${selectedService.name} : ${selectedService.price} XAF*\nSouhaitez-vous recevoir des informations sur le ${selectedService.name} ?\n\nRépondez par "Oui" ou "Non".`
        );
        transactionSteps[msg.from].step = "awaitTeachingInfoRequest";
        transactionSteps[msg.from].selectedService = selectedService;
      } else {
        // Si l'objet "name" contient des données, affichez ces données à l'utilisateur avec des numéros pour chaque sous-option
        const servicesOptions = selectedService.subservices.map(
          (serviceOption, index) => {
            return `${index + 1}. ${serviceOption.name} - ${
              serviceOption.price
            } XAF`;
          }
        );
        const servicesOptionsMessage = `Choisissez un enseignement pour les ${
          selectedService.type
        } en entrant son numéro :\n${servicesOptions.join("\n")}
        \n*. Menu précédent\n#. Menu principal`;
        msg.reply(servicesOptionsMessage);

        // Attendez que l'utilisateur choisisse une sous-option et demandez-lui s'il souhaite intégrer cette sous-option
        transactionSteps[msg.from].step = "awaitSubTeachingChoice";
        transactionSteps[msg.from].selectedService = selectedService;
      }
    } else if (
      transactionSteps[msg.from] &&
      transactionSteps[msg.from].step === "awaitTeachingInfoRequest"
    ) {
      // Attendez la réponse de l'utilisateur s'il souhaite intégrer le type
      const userResponseLower = userResponse.toLowerCase();

      if (userResponseLower === "oui") {
        // Le client a confirmé l'achat, continuez avec les options de paiement.
        const phoneNumberMessage =
          "Veuillez entrer votre numéro de téléphone pour la transaction Mobile Money (ex: 6xxxxxxxx):";
        msg.reply(phoneNumberMessage);

        transactionSteps[msg.from].step = "awaitPhoneNumber";
      } else if (userResponseLower === "non") {
        // Redirigez l'utilisateur vers le choix du type d'enseignement
        const services = transactionSteps[msg.from].services;
        const replyMessage =
          "Choisissez un enseignement en répondant avec son numéro :\n" +
          services
            .map((service, index) => {
              return `${index + 1}. ${service.name}`;
            })
            .join("\n");
        msg.reply(replyMessage);

        transactionSteps[msg.from].step = "awaitTeachingType";
      } else {
        const invalidConfirmationMessage = 'Répondez par "Oui" ou "Non".';
        msg.reply(invalidConfirmationMessage);
      }
    } else if (
      transactionSteps[msg.from] &&
      transactionSteps[msg.from].step === "awaitPhoneNumber"
    ) {
      const phoneNumber = userResponse.replace(/\s+/g, "");

      if (/^(?:\+237)?6(?:9|8|7|5)\d{7}$/.test(phoneNumber)) {
        // Vous avez le numéro de téléphone et les détails de l'enseignement choisi, initiez le paiement
        const selectedService = transactionSteps[msg.from]?.selectedService;
        MonetBil.processPayment(msg, phoneNumber, transactionSteps);
      } else {
        const invalidPhoneNumberMessage =
          "Le numéro de téléphone est invalide. Veuillez saisir un numéro de téléphone au format valide (ex: 6xxxxxxxx).";
        msg.reply(invalidPhoneNumberMessage);
      }
    } else if (
      transactionSteps[msg.from] &&
      transactionSteps[msg.from].step === "awaitSubTeachingChoice"
    ) {
      const teachingOptionNumber = parseInt(userResponse);
      const selectedService = transactionSteps[msg.from].selectedService;

      if (
        teachingOptionNumber >= 1 &&
        teachingOptionNumber <= selectedService.subservices.length
      ) {
        // L'utilisateur a choisi un enseignement, affichez les détails de l'enseignement
        const selectedServiceOption =
          selectedService.subservices[teachingOptionNumber - 1];
        const serviceDetailsMessage =
          `*Enseignement choisi :* \n${selectedService.name}: ${selectedServiceOption.name}\n` +
          `Prix : ${selectedServiceOption.price} XAF\n` +
          `Durée : ${selectedServiceOption.durationInDay} jours\n\n` +
          `Voulez-vous souscrire à cet enseignement ? \nRépondez par "Oui" ou "Non".`;

        msg.reply(serviceDetailsMessage);

        // Enregistrez l'étape de la transaction pour l'adhésion
        transactionSteps[msg.from].step = "awaitBuyConfirmation";
        transactionSteps[msg.from].selectedServiceOption =
          selectedServiceOption;
      } else if (userResponse === "*") {
        // L'utilisateur veut revenir à l'étape précédente
        const allProductsResponse = await getAllProducts("service");
        const services = allProductsResponse.products;
        const replyMessage =
          "Choisissez un enseignement en répondant avec son numéro :\n" +
          services
            .map((service, index) => {
              return `${index + 1}. ${service.name}`;
            })
            .join("\n");
        msg.reply(replyMessage + "\n\n#. Menu principal");
        transactionSteps[msg.from].step = "awaitTeachingType";
      } else {
        const invalidTeachingOptionMessage =
          "Le numéro que vous avez entré est invalide. Veuillez entrer un numéro valide.";
        msg.reply(invalidTeachingOptionMessage);
      }
    } else if (
      transactionSteps[msg.from] &&
      transactionSteps[msg.from].step === "awaitBuyConfirmation"
    ) {
      const userResponseLower = userResponse.toLowerCase();
      if (userResponseLower === "oui") {
        // Le client a confirmé l'achat, continuez avec les options de paiement.
        const phoneNumberMessage =
          "Veuillez entrer votre numéro de téléphone pour la transaction Mobile Money (ex: 6xxxxxxxx):";
        msg.reply(phoneNumberMessage);

        transactionSteps[msg.from].step = "await-phone-number";
      } else if (
        userResponseLower === "non" &&
        transactionSteps[msg.from].type === "ENSEIGNEMENTS"
      ) {
        // Redirigez l'utilisateur vers le choix du type d'enseignement
        const allProductsResponse = await getAllProducts("service");
        const services = allProductsResponse.products;
        const replyMessage =
          "Choisissez un enseignement en répondant avec son numéro :\n" +
          services
            .map((service, index) => {
              return `${index + 1}. ${service.name}`;
            })
            .join("\n");
        msg.reply(replyMessage + "\n\n#. Menu principal");
        transactionSteps[msg.from].step = "awaitTeachingType";
      } else if (
        userResponseLower === "non" &&
        transactionSteps[msg.from].type === "IA"
      ) {
        delete transactionSteps[msg.from];
        msg.reply(MenuPrincipal);
      } else {
        const invalidConfirmationMessage = 'Répondez par "Oui" ou "Non".';
        msg.reply(invalidConfirmationMessage);
      }
    } else if (
      transactionSteps[msg.from] &&
      transactionSteps[msg.from].step === "await-phone-number"
    ) {
      const phoneNumber = userResponse.replace(/\s+/g, "");

      if (/^(?:\+237)?6(?:9|8|7|5)\d{7}$/.test(phoneNumber)) {
        // Vous avez le numéro de téléphone et les détails de l'enseignement choisi, initiez le paiement
        const selectedServiceOption =
          transactionSteps[msg.from]?.selectedServiceOption;
        MonetBil.processPayment(msg, phoneNumber, transactionSteps);
      } else {
        const invalidPhoneNumberMessage =
          "Le numéro de téléphone est invalide. Veuillez saisir un numéro de téléphone au format valide (ex: 6xxxxxxxx).";
        msg.reply(invalidPhoneNumberMessage);
      }
    } else if (
      userResponse === COMMAND_NAME.NFT &&
      !transactionSteps[msg.from]
    ) {
      // Récupérer la liste des produits depuis la base de données
      const allProductsResponse = await getAllProducts("product");
      if (allProductsResponse.success) {
        const products = allProductsResponse.products;

        const productMessage = products.map((product, index) => {
          return `${index + 1}. ${product.name} - ${product.price} XAF\n`;
        });

        const productListMessage = `${productMessage.join(
          ""
        )}\n*Sélectionnez un NFT en entrant son numéro*\n\n#. Menu principal`;
        msg.reply(productListMessage);

        transactionSteps[msg.from] = { step: "awaitProductNumber", products };
      } else {
        const replyMessage = "Erreur lors de la récupération des produits.";
        msg.reply(replyMessage);
      }
    } else if (
      transactionSteps[msg.from] &&
      transactionSteps[msg.from].step === "awaitProductNumber"
    ) {
      const userProductNumber = parseInt(userResponse, 10);
      const products = transactionSteps[msg.from].products;
      const selectedProduct = products[userProductNumber - 1];

      if (selectedProduct) {
        // Afficher les détails du produit
        const productDetailsMessage = `*${
          selectedProduct.name
        }*\n\n*Description :*\n${
          selectedProduct.description
        }\n\n*Avantage* :\n${selectedProduct.advantage
          .split("\n")
          .map((advantage) => `• ${advantage}`)
          .join("\n")}\n\n*Prix :* ${
          selectedProduct.price
        }\n\nPour plus de détails : ${selectedProduct.link}`;
        msg.reply(productDetailsMessage);

        // Demander si l'utilisateur souhaite acheter le produit
        const buyConfirmationMessage =
          'Voulez-vous acheter ce NFT ? Entrez "Oui" ou "Non".';
        msg.reply(buyConfirmationMessage);

        transactionSteps[msg.from].step = "awaitBuyConfirmationProduct";
        transactionSteps[msg.from].selectedProduct = selectedProduct;
      } else {
        const invalidProductNumberMessage =
          "Le numéro que vous avez entré est invalide. Veuillez entrer un numéro valide.";
        msg.reply(invalidProductNumberMessage);
      }
    } else if (
      transactionSteps[msg.from] &&
      transactionSteps[msg.from].step === "awaitBuyConfirmationProduct"
    ) {
      if (userResponse.toLowerCase() === "oui") {
        // Demander au client de confirmer l'achat
        const confirmationMessage = `Vous avez choisi d'acheter le NFT:\n*${
          transactionSteps[msg.from].selectedProduct.name
        } - ${
          transactionSteps[msg.from].selectedProduct.price
        } XAF*. \n\nConfirmez vous l'achat de ce NFT? "Oui" ou "Non".`;
        msg.reply(confirmationMessage);

        transactionSteps[msg.from].step = "awaitBuyConfirmationConfirmation";
      } else if (userResponse.toLowerCase() === "non") {
        // Rediriger l'utilisateur vers la liste des NFT
        const products = transactionSteps[msg.from].products;
        const productMessage = products.map((product, index) => {
          return `${index + 1}. ${product.name} - ${product.price} XAF\n`;
        });
        const productListMessage = `${productMessage.join(
          ""
        )}\n*Sélectionnez un NFT en entrant son numéro*\n\n#. Menu principal`;
        msg.reply(productListMessage);

        transactionSteps[msg.from].step = "awaitProductNumber";
      } else {
        const invalidConfirmationMessage =
          'Veuillez répondre avec "oui" ou "non".';
        msg.reply(invalidConfirmationMessage);
      }
    } else if (
      transactionSteps[msg.from] &&
      transactionSteps[msg.from].step === "awaitBuyConfirmationConfirmation"
    ) {
      if (userResponse.toLowerCase() === "oui") {
        // Le client a confirmé l'achat, continuez avec les options de paiement.
        const paymentMethodMessage =
          "Choisissez le mode de paiement :\n1. Paiement Mobile Money\n2. Paiement par Crypto";
        msg.reply(paymentMethodMessage);

        transactionSteps[msg.from].step = "awaitPaymentMethod";
      } else if (userResponse.toLowerCase() === "non") {
        // Annuler l'achat et rediriger vers la liste des produits
        const products = transactionSteps[msg.from].products;
        const productMessage = products.map((product, index) => {
          return `${index + 1}. ${product.name} - ${product.price} XAF\n`;
        });
        const productListMessage = `${productMessage.join(
          ""
        )}\n*Sélectionnez un NFT en entrant son numéro*\n\n#. Menu principal`;
        msg.reply(productListMessage);

        transactionSteps[msg.from].step = "awaitProductNumber";
      } else {
        const invalidConfirmationMessage =
          'Veuillez répondre avec "Oui" ou "Non".';
        msg.reply(invalidConfirmationMessage);
      }
    } else if (
      transactionSteps[msg.from] &&
      transactionSteps[msg.from].step === "awaitPaymentMethod"
    ) {
      if (userResponse === "1") {
        // L'utilisateur a choisi le paiement Mobile Money.
        const phoneNumberMessage =
          "Veuillez entrer votre numéro de téléphone pour la transaction Mobile Money (ex: 6xxxxxxxx):";
        msg.reply(phoneNumberMessage);

        transactionSteps[msg.from].step = "askPhoneNumber";
      } else if (userResponse === "2") {
        // L'utilisateur a choisi le paiement Ejara.
        const replyMessage = "Bot en cours de développement.";
        msg.reply(replyMessage);

        transactionSteps[msg.from].step = "start";
      } else {
        const invalidPaymentMethodMessage =
          "Choisissez une option de paiement valide (1 ou 2).";
        msg.reply(invalidPaymentMethodMessage);
      }
    } else if (
      transactionSteps[msg.from] &&
      transactionSteps[msg.from].step === "askPhoneNumber"
    ) {
      const phoneNumber = userResponse.replace(/\s+/g, "");

      if (/^(?:\+237)?6(?:9|8|7|5)\d{7}$/.test(phoneNumber)) {
        // L'utilisateur a confirmé le paiement, vous pouvez maintenant traiter la transaction avec Monetbil
        const selectedProduct = transactionSteps[msg.from]?.selectedProduct;
        transactionSteps[msg.from].selectedService =
          transactionSteps[msg.from]?.selectedProduct;
        MonetBil.processPayment(msg, phoneNumber, transactionSteps);
        transactionSteps[msg.from].step = "start";
      } else {
        const invalidPhoneNumberMessage =
          "Le numéro de téléphone est invalide. Veuillez saisir un numéro de téléphone au format valide (ex: 6xxxxxxxx).";
        msg.reply(invalidPhoneNumberMessage);
      }
    } else if (
      userResponse === COMMAND_NAME.WELLNESS &&
      !transactionSteps[msg.from]
    ) {
      const allServices = await getAllProducts("wellness");
      if (allServices.success) {
        const services = allServices.products;

        const replyMessage =
          services.length > 0
            ? services[0].description
            : "Aucun service disponible.";
        msg.reply(replyMessage + "\n\n#. Menu principal");

        // Enregistrez l'étape de la transaction pour cet utilisateur
        transactionSteps[msg.from] = { step: "await-wellness-description" };
      } else {
        const replyMessage =
          "Erreur lors de la récupération des wellness center.";
        msg.reply(replyMessage);
      }
    } else if (
      userResponse === COMMAND_NAME.IA &&
      !transactionSteps[msg.from]
    ) {
      //we check first if the user has a chatgpt active service
      let phoneNumber = msg.from.replace(/@c\.us$/, "");
      const checkChatgpt = await getAllUserSubscriptions(
        phoneNumber,
        "chatgpt"
      );
      if (checkChatgpt.success && checkChatgpt.products.length > 0) {
        transactionSteps[msg.from] = {
          step: "awaitGptPrompt",
          type: "IA",
          availablesCredits: checkChatgpt.products[0].remainingTokens,
        };
        const replyMessage =
          "Hello, je suis votre assistant personnel. Comment puis-je vous aider aujourd'hui ?";
        msg.reply(replyMessage);
      } else {
        const allAiProductsResponse = await getAllProducts("chatgpt");
        if (allAiProductsResponse.success) {
          const aiMessage = allAiProductsResponse.products[0].subservices.map(
            (product, index) => {
              return `${index + 1}. ${product.name} - ${product.price} XAF\n`;
            }
          );

          const aiListMessage =
            "😞Oups, votre credit d'access a notre intelligence artificielle est de 0. Veuillez recharger votre compte\n\n" +
            aiMessage.join("") +
            `\n*Sélectionnez un forfait en entrant son numéro*
          \nNB: 1 credit = 1 message.
          \n\n#. Menu principal`;

          msg.reply(aiListMessage);
          transactionSteps[msg.from] = {
            step: "awaitChatgptBundle",
            type: "IA",
            selectedService: allAiProductsResponse.products[0],
          };
        } else {
          const replyMessage = "Une erreur s'est produite.";
          msg.reply(replyMessage);
        }
      }
    } else if (
      transactionSteps[msg.from] &&
      transactionSteps[msg.from].step === "awaitChatgptBundle"
    ) {
      const bundleNumber = parseInt(userResponse);
      const selectedService = transactionSteps[msg.from].selectedService;

      if (
        bundleNumber >= 1 &&
        bundleNumber <= selectedService.subservices.length
      ) {
        //user selected a bundle
        const selectedChatgptBundle =
          selectedService.subservices[bundleNumber - 1];
        const serviceDetailsMessage =
          `*Forfait choisi :* \n${selectedService.name}\n` +
          `Prix : ${selectedChatgptBundle.price} XAF\n` +
          `Crédit : ${selectedChatgptBundle.durationInDay}\n\n` +
          `Voulez-vous souscrire à ce forfait ? \nRépondez par "Oui" ou "Non".`;

        msg.reply(serviceDetailsMessage);

        // Enregistrez l'étape de la transaction pour l'adhésion
        transactionSteps[msg.from].step = "awaitBuyConfirmation";
        transactionSteps[msg.from].selectedServiceOption =
          selectedChatgptBundle;
      }
    } else if (
      transactionSteps[msg.from] &&
      transactionSteps[msg.from].step === "awaitGptPrompt"
    ) {
      let message = { role: "user", content: userResponse };
      let phone = msg.from.replace(/@c\.us$/, "");

      if (!transactionSteps[msg.from].userConversation) {
        const userConversation = await getAllConversations(phone);

        if (userConversation.success) {
          if (userConversation.conversation.length > 0) {
            transactionSteps[msg.from].userConversation =
              userConversation.success
                ? userConversation.conversation[0]?.messages?.map((message) => {
                    return {
                      role: message.role,
                      content: message.content,
                    };
                  }) || []
                : [];
          } else {
            transactionSteps[msg.from].userConversation = [];
          }
        } else {
          //gerer erreur
          return;
        }
      }

      let myConversation = transactionSteps[msg.from].userConversation;
      myConversation.push(message);
      if (transactionSteps[msg.from].availablesCredits <= 0) {
        // code a refactorer
        const allAiProductsResponse = await getAllProducts("chatgpt");
        if (allAiProductsResponse.success) {
          const aiMessage = allAiProductsResponse.products[0].subservices.map(
            (product, index) => {
              return `${index + 1}. ${product.name} - ${product.price} XAF\n`;
            }
          );

          const aiListMessage =
            "😞Oups, votre credit d'access a notre intelligence artificielle est de 0. Veuillez recharger votre compte\n\n" +
            aiMessage.join("") +
            `\n*Sélectionnez un forfait en entrant son numéro*
          \nNB: 1 credit = 1 message.
          \n\n#. Menu principal`;

          msg.reply(aiListMessage);
          transactionSteps[msg.from] = {
            step: "awaitChatgptBundle",
            type: "IA",
            selectedService: allAiProductsResponse.products[0],
          };
        } else {
          const replyMessage = "Une erreur s'est produite.";
          msg.reply(replyMessage);
        }
        return;
      }
      let currentChat = await client.getChatById(msg.from);

      const typingIntervalId = simulateTyping(currentChat, 30);

      let chatResult = await chatCompletion(myConversation);
      if (chatResult.success) {
        clearInterval(typingIntervalId); // Stop resending typing state
        currentChat.clearState();
        msg.reply(chatResult.completion.message.content);
        myConversation.push(chatResult.completion.message);
        transactionSteps[msg.from].userConversation = myConversation;
        transactionSteps[msg.from].availablesCredits -= 1;
        await Promise.all([
          addMessageToConversation(phone, message),
          addMessageToConversation(
            phone,
            chatResult.completion.message,
            chatResult.tokens
          ),
        ]);
      } else {
        clearInterval(typingIntervalId); // Stop resending typing state
        currentChat.clearState();
        msg.reply("Erreur lors de la generation de la reponse.");
      }
    } else if (
      userResponse === COMMAND_NAME.PRODUITS &&
      !transactionSteps[msg.from]
    ) {
      const allSubsriptions = await getAllUserSubscriptions(
        msg.from.replace(/@c\.us$/, "")
      );
      if (allSubsriptions.success) {
        const services = allSubsriptions.products;

        if (services.length === 0) {
          msg.reply(
            "*Aucun produit et service disponible pour l'instant.*\n\n#. Menu principal"
          );
        } else {
          // Affichez les types d'enseignement à l'utilisateur avec des numéros
          const replyMessage =
            `Consultez la liste de vos produits et services en cours\n\n` +
            services
              .map((service, index) => {
                let n = service?.isOption
                  ? service?.productType === "service"
                    ? service?.productId.category +
                      ": " +
                      service?.productId.name
                    : service?.productId.category
                  : service?.productId?.name ||
                    service?.eventId?.name +
                      ` (${moment(service?.eventId?.date).format("DD MMM YYYY")})`;
                return `${index + 1}. ${n}`;
              })
              .join("\n");
          msg.reply(replyMessage + "\n\n#. Menu principal");
        }
        // Enregistrez l'étape de la transaction pour cet utilisateur
        transactionSteps[msg.from] = {
          step: "awaitSubscriptionType",
          type: "PRODUITS",
          services,
        };
      } else {
        const replyMessage =
          "Erreur lors de la récupération de vos produits et services.";
        msg.reply(replyMessage);
      }
    } else if (
      transactionSteps[msg.from] &&
      transactionSteps[msg.from].step === "awaitSubscriptionType"
    ) {
      const userItemNumber = parseInt(userResponse, 10);
      const services = transactionSteps[msg.from].services;

      // Vérifier si le numéro saisi est valide
      if (userItemNumber >= 1 && userItemNumber <= services.length) {
        const selectedItem = services[userItemNumber - 1];

        if (selectedItem.productType === "product") {
          const productDetailsMessage = `*${
            selectedItem.productId.name
          }*\n\n*Description :*\n${
            selectedItem.productId.description
          }\n\n*Avantage* :\n${selectedItem.productId.advantage
            .split("\n")
            .map((advantage) => `• ${advantage}`)
            .join("\n")}\n\nPour plus de détails : ${
            selectedItem.productId.link
          }`;
          msg.reply(productDetailsMessage);

          // Demander si l'utilisateur souhaite acheter le produit
          const regenerateFactureMessage =
            "Si vous souhaitez regénérer votre facture entrez *Facture*";
          msg.reply(regenerateFactureMessage + "\n\n#. Menu principal");

          transactionSteps[msg.from].step = "awaitConfirmationRequest";
          transactionSteps[msg.from].selectedItem = selectedItem;
        } else if (
          selectedItem.productType === "service" ||
          selectedItem.productType === "chatgpt"
        ) {
          const serviceDetailsMessage = selectedItem.isOption
            ? `${selectedItem.productId.category} : *${
                selectedItem.productId.name
              }*\n${selectedItem.productId.description || ""}\n` +
              `${
                selectedItem.productType === "service"
                  ? ""
                  : "*Credit restant*" + ": " + selectedItem.remainingTokens
              }`
            : `*${selectedItem.productId.name}* :\n\n${selectedItem.productId.description}`;
          msg.reply(serviceDetailsMessage);

          // Demander si l'utilisateur souhaite acheter le produit
          const regenerateFactureMessage =
            "Si vous souhaitez regénérer votre facture entrez *Facture*" + "";
          msg.reply(regenerateFactureMessage + "\n\n#. Menu principal");

          transactionSteps[msg.from].step = "awaitConfirmationRequest";
          transactionSteps[msg.from].selectedItem = selectedItem;
        } else if (selectedItem.productType === "event") {
          const eventDetailsMessage = `*${selectedItem.eventId.name}*\n\n*Description :*\n${selectedItem.eventId.description}\n\n*📅Date :*\n${selectedItem.eventId.date}\n\n*⏰Heure :*\n${selectedItem.eventId.time}\n\n*📍Lieu :*\n${selectedItem.eventId.place}\n\n*Nom du pack :*${selectedItem.packId.name}\n\n*Prix du pack :*${selectedItem.packId.price}`;
          try {
            const mediaMessage = await MessageMedia.fromUrl(
              process.env.BASE_URL_CLOUD + selectedItem.eventId.previewImage
            );
            await client.sendMessage(msg.from, mediaMessage, {
              caption: eventDetailsMessage,
            });
          } catch (error) {
            console.log(error, "error");
            msg.reply(eventDetailsMessage);
          }

          const regenerateFactureMessage = moment(
            selectedItem.eventId.date
          ).isBefore(new Date())
            ? "Pour voir la galerie de cet évènement, entrez *Galerie*.\n"
            : "";
          msg.reply(
            "Pour regénérer votre facture, entrez *Facture*.\n\n" +
              regenerateFactureMessage +
              "\n\n#. Menu principal"
          );

          transactionSteps[msg.from].step = "awaitConfirmationRequest";
          transactionSteps[msg.from].selectedItem = selectedItem;
        }
      } else {
        msg.reply(
          "Numéro invalide. Veuillez sélectionner un numéro valide de la liste."
        );
      }
    } else if (
      transactionSteps[msg.from] &&
      transactionSteps[msg.from].step === "awaitConfirmationRequest"
    ) {
      const userWord = userResponse;
      const selectedItem = transactionSteps[msg.from].selectedItem;

      if (
        userWord.toLowerCase() === "facture" &&
        transactionSteps[msg.from].type === COMMAND_NAME.PRODUITS
      ) {
        const pdfBuffer = await generatePDFBuffer(
          contact.pushname,
          msg.from.replace(/@c\.us$/, ""),
          selectedItem?.transaction_id,
          selectedItem.productType === "event"
            ? selectedItem.eventId.name
            : selectedItem.productId?.name,
          selectedItem?.operator,
          selectedItem.productType === "event"
            ? selectedItem.eventId.pack.price
            : selectedItem.productId?.price,
          selectedItem.productId?.durationInDay,
          selectedItem.productType === "product"
            ? `https://bibemella.isomora.com/wp-content/uploads/${selectedItem.productId?.image}`
            : selectedItem.productType === "event"
            ? process.env.BASE_URL_CLOUD + selectedItem.eventId.previewImage
            : "",
          moment(selectedItem?.subscriptionDate)
        );
        const pdfBase64 = pdfBuffer.toString("base64");
        const pdfName = "facture.pdf";
        const documentType = "application/pdf";
        await sendMediaToNumber(
          client,
          `${msg.from}`,
          documentType,
          pdfBase64,
          pdfName
        );

        delete transactionSteps[msg.from];
        msg.reply(MenuPrincipal);
      } else if (userWord.toLowerCase() === "galerie") {
        const photos = selectedItem?.eventId?.gallery || selectedItem?.gallery;
        if (photos.length > 0) {
          msg.reply("Consultez la galerie: ");
          try {
            for (const imageUrl of photos) {
              const mediaMessage = await MessageMedia.fromUrl(
                process.env.BASE_URL_CLOUD + imageUrl
              );
              await client.sendMessage(msg.from, mediaMessage);
            }
          } catch (e) {
            msg.reply("Une erreur s'est produite lors de l'envoi des medias");
          }
        } else {
          msg.reply(
            "Aucune image disponible dans la galerie pour l'instant. \n\n#. Menu principal"
          );
        }
      } else {
        delete transactionSteps[msg.from];
        msg.reply(MenuPrincipal);
      }
    } else if (
      userResponse === COMMAND_NAME.EVENTS &&
      !transactionSteps[msg.from]
    ) {
      const eventsResponse = await getAllEvents();
      if (eventsResponse.success) {
        let events = eventsResponse.events;
        const replyMessage =
          "Choisissez un évènements en répondant avec son numéro :\n" +
          events
            .map((event, index) => {
              return `${index + 1}. ${event.name} (${moment(event.date).format(
                "DD MMM YYYY"
              )})`;
            })
            .join("\n");
        msg.reply(replyMessage + "\n\n#. Menu principal");

        // Enregistrez l'étape de la transaction pour cet utilisateur
        transactionSteps[msg.from] = {
          step: "awaitEventSelect",
          type: "EVENTS",
          events,
        };
      }
    } else if (
      transactionSteps[msg.from] &&
      transactionSteps[msg.from].step === "awaitEventSelect"
    ) {
      const userChoice = parseInt(userResponse);
      const events = transactionSteps[msg.from].events;
      const selectedEvent = events[userChoice - 1];

      if (selectedEvent) {
        // Afficher les détails du produit
        const eventDetailsMessage = `*${selectedEvent.name}*\n\n*Description :*\n${selectedEvent.description}\n\n*📅Date :*\n${selectedEvent.date}\n\n*⏰Heure :*\n${selectedEvent.time}\n\n*📍Lieu :*\n${selectedEvent.place}\n\n`;

        try {
          const mediaMessage = await MessageMedia.fromUrl(
            process.env.BASE_URL_CLOUD + selectedEvent.previewImage
          );
          await client.sendMessage(msg.from, mediaMessage, {
            caption: eventDetailsMessage,
          });
        } catch (error) {
          console.log(error, "error");
          msg.reply(eventDetailsMessage);
        }

        // Demander si l'utilisateur souhaite acheter le produit
        const buyConfirmationMessage =
          'Voulez-vous participer a cet évènement ? Entrez "Oui" ou "Non".';
        const regenerateFactureMessage =
          "Cet évènement est terminé.\n Pour consulter la galerie de cet évènement, entrez *Galerie*.\n";
        if (moment(selectedEvent.date).isBefore(new Date())) {
          msg.reply(regenerateFactureMessage);
          transactionSteps[msg.from].step = "awaitConfirmationRequest";
          transactionSteps[msg.from].selectedItem = selectedEvent;
        } else {
          msg.reply(buyConfirmationMessage);
          transactionSteps[msg.from].step = "awaitSelectEventpack";
          transactionSteps[msg.from].selectedEvent = selectedEvent;
        }
      } else {
        const invalidEventNumberMessage =
          "Le numéro que vous avez entré est invalide. Veuillez entrer un numéro valide.";
        msg.reply(invalidEventNumberMessage);
      }
    } else if (
      transactionSteps[msg.from] &&
      transactionSteps[msg.from].step === "awaitSelectEventpack"
    ) {
      if (userResponse.toLowerCase() === "oui") {
        const selectedEvent = transactionSteps[msg.from].selectedEvent;
        const packs = selectedEvent.pack;

        const packMessage =
          "Choisissez un pack en répondant avec son numéro :\n" +
          packs
            .map((pack, index) => {
              return `${index + 1}. *${pack.name}:* ${pack.price} XFA`;
            })
            .join("\n");
        msg.reply(packMessage + "\n\n#. Menu principal");

        transactionSteps[msg.from].step = "awaitBuyConfirmationEvent";
      } else if (userResponse.toLowerCase() === "non") {
        delete transactionSteps[msg.from];
        msg.reply(MenuPrincipal);
      } else {
        const invalidConfirmationMessage = 'Répondez par "Oui" ou "Non".';
        msg.reply(invalidConfirmationMessage);
      }
    } else if (
      transactionSteps[msg.from] &&
      transactionSteps[msg.from].step === "awaitBuyConfirmationEvent"
    ) {
      const userPackNumber = parseInt(userResponse, 10);
      const packs = transactionSteps[msg.from].selectedEvent.pack;
      const selectedPack = packs[userPackNumber - 1];
      transactionSteps[msg.from].selectedPack = selectedPack;

      if (selectedPack) {
        // Le client a confirmé l'achat, continuez avec les options de paiement.
        const eventMsg =
          `Details de l'évènement: \n\nName: *${
            transactionSteps[msg.from].selectedEvent.name
          }*` +
          `\nLieu: ${transactionSteps[msg.from].selectedEvent.place}` +
          `\nDate: ${transactionSteps[msg.from].selectedEvent.date}` +
          `\nHeure: ${transactionSteps[msg.from].selectedEvent.time}` +
          `\nPack: ${selectedPack.name} ${selectedPack.price} XFA.\n\n`;
        const fullNameMessage =
          "Pour votre inscription a cet évènement, veuillez entrer votre nom complet: ";
        msg.reply(eventMsg);
        msg.reply(fullNameMessage);

        transactionSteps[msg.from].step = "awaitFullName";
      } else {
        const invalidConfirmationMessage =
          "Le numéro que vous avez entré est invalide. Veuillez entrer un numéro valide.";
        msg.reply(invalidConfirmationMessage);
      }
    } else if (
      transactionSteps[msg.from] &&
      transactionSteps[msg.from].step === "awaitFullName"
    ) {
      transactionSteps[msg.from].userName = userResponse;
      const villeMessage = "Veuillez entrer votre ville de residence";
      msg.reply(villeMessage);
      transactionSteps[msg.from].step = "awaitTown";
    } else if (
      transactionSteps[msg.from] &&
      transactionSteps[msg.from].step === "awaitTown"
    ) {
      transactionSteps[msg.from].userTown = userResponse;
      let upda = await updateUser(msg.from.replace(/@c\.us$/, ""), {
        fullname: transactionSteps[msg.from].userName,
        city: userResponse,
      });
      const trasac =
        "Vos informations ont ete enregistrer avec success.\n\n" +
        "Veuillez entrer votre numéro de téléphone pour la transaction Mobile Money (ex: 6xxxxxxxx):";
      msg.reply(trasac);
      transactionSteps[msg.from].step = "awaitPhoneNumber";
    } else {
      if (msg.body.toLowerCase() === "ejara") {
        msg.reply(
          "Possédez-vous un compte Ejara?\n\nRepondez par 'oui' ou 'non'"
        );

        transactionSteps[msg.from].step = "ask-ejara-account";
      } else if (
        transactionSteps[msg.from] &&
        transactionSteps[msg.from].step === "ask-ejara-account"
      ) {
        const userResponseEjara = userResponse.toLowerCase();

        if (userResponseEjara === "oui") {
          // Le client a confirmé l'achat, continuez avec les options de paiement.
          const ejaraName =
            "*Veuillez renseigner votre nom d'utilisatur Ejara*";
          msg.reply(ejaraName);

          transactionSteps[msg.from].step = "ask-ejara-name";
          transactionSteps[msg.from].ejaraName = ejaraName;
        } else if (userResponseEjara === "non") {
          // Redirigez l'utilisateur vers le choix du type d'enseignement
          delete transactionSteps[msg.from];
          msg.reply(MenuPrincipal);
        }
      } else if (
        transactionSteps[msg.from] &&
        transactionSteps[msg.from].step === "ask-ejara-name"
      ) {
        const ejaraName = transactionSteps[msg.from].ejaraName;
        const phoneNumber = msg.from;
        const updatedData = {
          username_ejara: ejaraName,
        };
        const userUpdated = await updateUser(phoneNumber, updatedData);
        if (userUpdated.success) {
          msg.reply(
            `Le nom d'utilisateur Ejara a été mis à jour avec succès pour ${userUpdated.user.username_ejara}.`
          );
          // Continuez avec d'autres étapes si nécessaire
        } else {
          msg.reply(
            `Erreur lors de la mise à jour du nom d'utilisateur Ejara : ${userUpdated.message}`
          );
          // Gérez l'erreur ou revenez à une étape précédente si nécessaire
        }
      }
      // Gérer d'autres cas d'utilisation ou afficher un message d'erreur
      else delete transactionSteps[msg.from];
      msg.reply(MenuPrincipal);
    }
  }
};

module.exports = {
  UserCommander,
};
