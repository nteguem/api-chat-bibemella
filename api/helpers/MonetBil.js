require('dotenv').config();
const axios = require('axios');

async function processPayment(msg, phoneNumber, selectedForfait, transactionSteps) {
  const paymentData = {
    service: process.env.PAYMENT_SERVICE_ID,
    phonenumber: phoneNumber.replace(/^\+/, '').replace(/\s/g, ''),
    amount: selectedForfait?.price,
    user: msg.from.replace(/@c\.us$/, ""),
    first_name: selectedForfait?.durationInDays,
    item_ref: selectedForfait?.name,
    last_name:process.env.LOGO_APP,
    email:process.env.BACKGROUND_LOGO,
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
