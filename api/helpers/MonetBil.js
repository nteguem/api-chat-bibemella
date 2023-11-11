require('dotenv').config();
const axios = require('axios');

async function processPayment(msg, phoneNumber, selectedForfait, transactionSteps) {
  const contact = await msg.getContact();
  const paymentData = {
    service: process.env.PAYMENT_SERVICE_ID,
    phonenumber: phoneNumber.replace(/^\+/, '').replace(/\s/g, ''),
    // amount: selectedForfait?.price,
    amount: 1,
    user: contact.pushname,
    first_name: selectedForfait?.type == "NFT" ? selectedForfait?.durationInDays : 0 ,
    last_name: selectedForfait?.type == "NFT" ? selectedForfait?.image : '',
    item_ref: selectedForfait?.name,
    email: msg.from.replace(/@c\.us$/, ""),

  };

  const apiEndpoint = process.env.PAYMENT_API_ENDPOINT;

  try {
    const response = await axios.post(apiEndpoint, paymentData);

    if (response.data.status == "REQUEST_ACCEPTED") {
      const confirmationMessage = `Transaction ${response.data.channel_name} en cours de traitement veuillez saisir ${response.data.channel_ussd}`;
      msg.reply(confirmationMessage);
    } else {
      const errorMessage = 'La transaction n\'a pas été effectuée. Veuillez réessayer plus tard.';
      msg.reply(errorMessage);
    }
  } catch (error) {
    console.error(error);
    const errorMessage = 'Une erreur s\'est produite lors du traitement de la transaction. Veuillez réessayer plus tard.';
    msg.reply(errorMessage);
  } finally {
    delete transactionSteps[msg.from];
  }
}

module.exports = {
  processPayment
};
