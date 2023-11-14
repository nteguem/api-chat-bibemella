const axios = require("axios");
const MonetBil = require("../MonetBil");
require("dotenv").config(); // Charger les variables d'environnement depuis le fichier .env
const { updateUser } = require("../../services/user.service");
const { welcomeData, menuData } = require("../../data");
const { getAllProducts } = require("../../services/product.service");
const { getAllUserSubscriptions } = require("../../services/product.service");
const generatePDFBuffer = require("../pdfGenerator");
const { sendMediaToNumber } = require("./whatsappMessaging");
const moment = require('moment');

const welcomeStatusUser = {};
const transactionSteps = {};

const COMMAND_NAME = {
  ENSEIGNEMENTS: "1",
  NFT: "2",
  WELLNESS: "3",
  IA: "4",
  PRODUITS: "5",
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
      const userUpdated = await updateUser(
        cleanedPhoneNumber,
        ejaraNameResponse
      );
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
            return `${index + 1}. ${serviceOption.name} - ${serviceOption.price
              } XAF`;
          }
        );
        const servicesOptionsMessage = `Choisissez un enseignement pour les ${selectedService.type
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
        const selectedServiceOption = selectedService.subservices[teachingOptionNumber - 1];
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
      } else if (userResponseLower === "non") {
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
        const productDetailsMessage = `*${selectedProduct.name
          }*\n\n*Description :*\n${selectedProduct.description
          }\n\n*Avantage* :\n${selectedProduct.advantage
            .split("\n")
            .map((advantage) => `• ${advantage}`)
            .join("\n")}\n\n*Prix :* ${selectedProduct.price
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
        const confirmationMessage = `Vous avez choisi d'acheter le NFT:\n*${transactionSteps[msg.from].selectedProduct.name
          } - ${transactionSteps[msg.from].selectedProduct.price
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
    } else if (userResponse === COMMAND_NAME.WELLNESS && !transactionSteps[msg.from]) {
      const allServices = await getAllProducts("wellness");
      if (allServices.success) {
        const services = allServices.products;

        const replyMessage = services.length > 0 ? services[0].description : "Aucun service disponible.";
        msg.reply(replyMessage + "\n\n#. Menu principal");

        // Enregistrez l'étape de la transaction pour cet utilisateur
        transactionSteps[msg.from] = { step: "await-wellness-description" };
      } else {
        const replyMessage =
          "Erreur lors de la récupération des wellness center.";
        msg.reply(replyMessage);
      }
    } else if (userResponse === COMMAND_NAME.IA && !transactionSteps[msg.from]) {
      const invalidRequestMessage = `Bot en cours de développement pour répondre à  ce service ultérieurement.`;
      msg.reply(invalidRequestMessage);

      delete transactionSteps[msg.from];
      msg.reply(MenuPrincipal);
    } else if (userResponse === COMMAND_NAME.PRODUITS && !transactionSteps[msg.from]) {
      const allSubsriptions = await getAllUserSubscriptions(msg.from.replace(/@c\.us$/, ""));
      if (allSubsriptions.success) {
        const services = allSubsriptions.products;

        if (services.length === 0) {
          msg.reply("*Aucun produit et service disponible pour l'instant.*\n\n#. Menu principal");
        } else {
          // Affichez les types d'enseignement à l'utilisateur avec des numéros
          const replyMessage =
            `Consultez la liste de vos produits et services en cours\n\n` +
            services.map((service, index) => {
              let n = service.isOption ? service.productId.category + " : " + service.productId.name : service.productId.name;
              return `${index + 1}. ${n}`;
            }).join("\n");
          msg.reply(replyMessage + "\n\n#. Menu principal");
        }
        // Enregistrez l'étape de la transaction pour cet utilisateur
        transactionSteps[msg.from] = { step: "awaitSubscriptionType", type: "PRODUITS", services };
      } else {
        const replyMessage =
          "Erreur lors de la récupération de vos produits et services.";
        msg.reply(replyMessage);
      }
    }
    else if (transactionSteps[msg.from] && transactionSteps[msg.from].step === "awaitSubscriptionType") {
      const userItemNumber = parseInt(userResponse, 10);
      const services = transactionSteps[msg.from].services;
      const selectedItem = services[userItemNumber - 1];
      console.log(selectedItem)

      if (selectedItem.productType === 'product') {
        const productDetailsMessage = `*${selectedItem.productId.name
          }*\n\n*Description :*\n${selectedItem.productId.description
          }\n\n*Avantage* :\n${selectedItem.productId.advantage
            .split("\n")
            .map((advantage) => `• ${advantage}`)
            .join("\n")}\n\nPour plus de détails : ${selectedItem.productId.link}`;
        msg.reply(productDetailsMessage);

        // Demander si l'utilisateur souhaite acheter le produit
        const regenerateFactureMessage = 'Si vous souhaitez regénérer votre facture entrez *Facture*';
        msg.reply(regenerateFactureMessage + "\n\n#. Menu principal");

        transactionSteps[msg.from].step = "awaitConfirmationRequest";
        transactionSteps[msg.from].selectedItem = selectedItem;
      } else if (selectedItem.productType === 'service') {
        const serviceDetailsMessage = selectedItem.isOption ? `${selectedItem.productId.category} : *${selectedItem.productId.name}*\n\n${selectedItem.productId.description}` : `*${selectedItem.productId.name}* :\n\n${selectedItem.productId.description}`;
        msg.reply(serviceDetailsMessage);

        // Demander si l'utilisateur souhaite acheter le produit
        const regenerateFactureMessage = 'Si vous souhaitez regénérer votre facture entrez *Facture*';
        msg.reply(regenerateFactureMessage + "\n\n#. Menu principal");

        transactionSteps[msg.from].step = "awaitConfirmationRequestOption";
        transactionSteps[msg.from].selectedItem = selectedItem;
      }
    }
    else if (transactionSteps[msg.from] && transactionSteps[msg.from].step === "awaitConfirmationRequest") {
      const userWord = userResponse;
      const selectedItem = transactionSteps[msg.from].selectedItem;
      const services = transactionSteps[msg.from].services;
      if (userWord.toLowerCase() === 'facture') {
        const pdfBuffer = await generatePDFBuffer(contact.pushname, msg.from.replace(/@c\.us$/, ""), selectedItem?.transaction_id, selectedItem.productId?.name, selectedItem?.operator, selectedItem.productId?.price, selectedItem.productId?.durationInDays, selectedItem.productId?.image, moment(selectedItem?.subscriptionDate));
        const pdfBase64 = pdfBuffer.toString('base64');
        const pdfName = 'facture.pdf';
        const documentType = 'application/pdf'; 
        await sendMediaToNumber(client, `${msg.from}`, documentType, pdfBase64, pdfName)
      }
    } else if (transactionSteps[msg.from] && transactionSteps[msg.from].step === "awaitConfirmationRequestOption") {
      if (userWord.toLowerCase() === 'facture') {
        const pdfBuffer = selectedItem.isOption ?
          await generatePDFBuffer(contact.pushname, msg.from.replace(/@c\.us$/, ""), selectedItem?.transaction_id,
            selectedItem.productId?.name, selectedItem?.operator, selectedItem.productId?.price, selectedItem.productId?.durationInDays,
            selectedItem.productId?.image, moment(selectedItem?.subscriptionDate)) :
          await generatePDFBuffer(contact.pushname, msg.from.replace(/@c\.us$/, ""), selectedItem?.transaction_id,
            selectedItem.productId?.name, selectedItem?.operator, selectedItem.productId?.price, selectedItem.productId?.durationInDays,
            selectedItem.productId?.image, moment(selectedItem?.subscriptionDate));
        const pdfBase64 = pdfBuffer.toString('base64');
        const pdfName = 'facture.pdf';
        const documentType = 'application/pdf';
        await sendMediaToNumber(client, `${msg.from}`, documentType, pdfBase64, pdfName) 
      }
    }
    else {
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
