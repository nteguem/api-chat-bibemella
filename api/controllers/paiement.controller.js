const moment = require("moment");
const {
  sendMessageToNumber,
  sendMediaToNumber,
} = require("../helpers/whatsApp/whatsappMessaging");
const generatePDFBuffer = require("../helpers/pdfGenerator");
const { addProductToUser } = require("../services/product.service");
const { addTransaction } = require("../services/transactions.service");
const { addAmountToTotal } = require("../services/totalTransaction.service");
const { addEventToUser } = require("../services/events.service");
const { getAdminUsers, getAllUser } = require("../services/user.service");

async function handlePaymentSuccess(req, res, client) {
  try {
    const {
      user,
      phone,
      operator_transaction_id,
      item_ref,
      amount,
      operator,
      email,
    } = req.body;

    let serviceData = JSON.parse(item_ref);
    serviceData.status = "SUCCESS";
    serviceData.transactionId = operator_transaction_id;
    serviceData.operator = operator;
    serviceData.transactionNumber = phone;

    let servName = serviceData?.hasSub
      ? serviceData.name + ": " + `*${serviceData?.selectedServiceOption.name}*`
      : `*${serviceData.name}*`;

    const dateSubscription = moment().format("YYYY-MM-DD");
    const successMessage = `Félicitations ! Votre paiement pour  ${servName} a été effectué avec succès. Profitez de nos services premium ! Ci-joint la facture de paiement.`;
    const expirationDate = moment(dateSubscription).add(
      serviceData?.durationInDays,
      "days"
    );
    const formattedExpirationDate = expirationDate.format("YYYY-MM-DD");
    const addSubscription = {
      ...serviceData,
      ...(serviceData?.durationInDays != 0
        ? {
            expirationDate:
              serviceData?.type === "service" ? formattedExpirationDate : null,
          }
        : {}),
    };
    let img =
      serviceData?.type === "product"
        ? process.env.BASE_URL_CLOUD + serviceData.image
        : serviceData?.type === "events"
        ? process.env.BASE_URL_CLOUD + serviceData.image
        : "";
    const pdfBuffer = await generatePDFBuffer(
      user,
      phone,
      operator_transaction_id,
      servName,
      operator,
      amount,
      serviceData?.durationInDays || 0,
      img
    );
    const pdfBase64 = pdfBuffer.toString("base64");
    const pdfName = "facture.pdf";
    const documentType = "application/pdf";

    if (serviceData?.type === "events") {
      await Promise.all([
        sendMediaToNumber(
          client,
          `${email}@c\.us`,
          documentType,
          pdfBase64,
          pdfName
        ),
        addEventToUser(
          email,
          addSubscription,
          operator_transaction_id,
          operator
        ),
        addAmountToTotal({ price: serviceData.price }),
        addTransaction(serviceData),
        sendMessageToNumber(client, `${email}@c\.us`, successMessage),
      ]);
    } else {
      await Promise.all([
        sendMediaToNumber(
          client,
          `${email}@c\.us`,
          documentType,
          pdfBase64,
          pdfName
        ),
        addProductToUser(
          email,
          addSubscription,
          operator_transaction_id,
          operator
        ),
        addAmountToTotal({ price: serviceData.price }),
        addTransaction(serviceData),
        sendMessageToNumber(client, `${email}@c\.us`, successMessage),
      ]);
    }

    if (serviceData?.image != "") {
      await sendMessageToNumber(
        client,
        `${email}@c\.us`,
        `Super ! Merci de renseigner votre nom d'utilisateur Ejara en saissisant *ejara*\n\n 
      Si vous n'avez pas encore de compte Ejara, suivez ce lien pour découvrir comment créer un compte : https://youtu.be/wLkfXWOYCco`
      );
    }
    //function qui permet de notifier tout les users
    let responses = await getAdminUsers();
    if (responses.success) {
      let formattedMessage;
      let userResponses = await getAllUser({phoneNumber: email});
      let userInfos = userResponses.users[0];
      let n = userInfos.fullname ? userInfos.fullname : userInfos.name;

      let userMessage = `\nNom de l'utilisateur: ${n}\nNumero de telephone: ${userInfos.phoneNumber}`
      
      if (serviceData.type === "product") {
        formattedMessage = `Nouvel achat d'un produit NFT:\n\n${servName}\nPrix: ${serviceData.price}\n`;
      } else if (serviceData.type === "events") {
        formattedMessage = `Nouvelle souscription d'un évènement:\n\nNom de l'évènement: *${servName}*\nPrix: ${serviceData.price}\n`;
      } else {
        formattedMessage = `Nouvel achat d'un service:\n\n${servName}\nPrix: ${serviceData.price}\n`;
      }

      let adminUsers = responses.users;
      for (const adminUser of adminUsers){
        await sendMessageToNumber(
        client,
        `${adminUser.phoneNumber}@c\.us`,
        '*Notification:* \n\n'+formattedMessage+userMessage
      );
      }
    }

    res.status(200).send("Success");
  } catch (error) {
    res.status(500).send("Erreur lors du traitement.");
  }
}

async function handlePaymentFailure(req, res, client, operatorMessage) {
  try {
    const {
      user,
      phone,
      operator_transaction_id,
      item_ref,
      amount,
      operator,
      email,
    } = req.body;

    let serviceData = JSON.parse(item_ref);
    serviceData.status = "FAILED";
    serviceData.transactionId = operator_transaction_id;
    serviceData.operator = operator;
    serviceData.transactionNumber = phone;

    const failureMessage =
      operatorMessage ||
      `Désolé, Votre paiement mobile pour le forfait ${req.body.item_ref} a échoué en raison d'un problème de transaction. Veuillez vérifier vos détails de paiement et réessayer. Si le problème persiste, contactez-nous pour de l'aide. Nous nous excusons pour tout désagrément.
    Cordialement, L'équipe de Bibemella`;
    await Promise.all([
      addTransaction(serviceData),
      sendMessageToNumber(client, `${req.body.user}@c\.us`, failureMessage),
    ]);
    res.status(200).send("Failure");
  } catch (error) {
    console.error(error);
    res.status(500).send("Erreur lors du traitement.");
  }
}

async function handlePaymentNotification(req, res, client) {
  try {
    if (req.body.message === "FAILED") {
      await handlePaymentFailure(req, res, client);
    } else if (req.body.message === "INTERNAL_PROCESSING_ERROR") {
      const operatorMessage = `Désolé, Votre paiement mobile a rencontré une erreur due à un problème technique avec le service ${req.body.operator}. Nous travaillons sur la résolution de ce problème. En attendant, nous vous recommandons d'essayer à nouveau plus tard. Désolé pour le dérangement. 
      Cordialement, L'équipe Bibemella`;
      await handlePaymentFailure(req, res, client, operatorMessage);
    } else {
      await handlePaymentSuccess(req, res, client);
    }
  } catch (error) {
    res.status(500).send("Erreur lors du traitement.");
  }
}

module.exports = {
  handlePaymentNotification,
};
