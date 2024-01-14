require("dotenv").config();
const axios = require("axios");

async function processPayment(msg, phoneNumber, transactionSteps) {
  const contact = await msg.getContact();
  let inputObject = transactionSteps[msg.from];

  // console.log(inputObject);

  const resultObject = inputObject.type === 'EVENTS' ? 
  {
    userPhoneNumber: msg.from.replace(/@c\.us$/, ""),
    itemId: inputObject.selectedEvent._id,
    name: inputObject.selectedEvent.name,
    image: inputObject.selectedEvent.previewImage,
    price: inputObject.selectedPack.price,
    location: inputObject.selectedEvent.place,
    date: inputObject.selectedEvent.date,
    time: inputObject.selectedEvent.time,
    fullName: inputObject.userName,
    userTown: inputObject.userTown,
    type: 'events',
    packId: inputObject.selectedPack._id
  }
  :
  {
    userPhoneNumber: msg.from.replace(/@c\.us$/, ""),
    itemId: inputObject.selectedService._id,
    name: inputObject.selectedService.name,
    image:
      inputObject.selectedService.type === "product"
        ? inputObject.selectedService?.image
        : "",
    durationInDays:
      inputObject.selectedService.type === "product"
        ? 0
        : inputObject.selectedService?.hasSub
          ? inputObject?.selectedServiceOption?.durationInDay
          : inputObject.selectedService?.durationInDay,
    type: inputObject.selectedService.type,
    hasSub: inputObject.selectedService?.hasSub,
    selectedServiceOption: inputObject.selectedService?.hasSub
      ? inputObject.selectedServiceOption
      : null,
    price: inputObject.selectedService?.hasSub
      ? inputObject?.selectedServiceOption?.price
      : inputObject.selectedService.price
  };
  
  const paymentData = {
    service: process.env.PAYMENT_SERVICE_ID,
    phonenumber: phoneNumber.replace(/^\+/, "").replace(/\s/g, ""),
    // amount: resultObject?.price,
    amount: 1,
    user: contact.pushname,
    first_name: resultObject.durationInDays,
    last_name: resultObject.image,
    item_ref: JSON.stringify(resultObject),
    email: msg.from.replace(/@c\.us$/, ""),
  };

  const apiEndpoint = process.env.PAYMENT_API_ENDPOINT;

  try {
    const response = await axios.post(apiEndpoint, paymentData);

    if (response.data.status == "REQUEST_ACCEPTED") {
      const confirmationMessage = `Transaction ${response.data.channel_name} en cours de traitement veuillez saisir ${response.data.channel_ussd}`;
      msg.reply(confirmationMessage);
    } else {
      const errorMessage =
        "La transaction n'a pas été effectuée. Veuillez réessayer plus tard.";
      msg.reply(errorMessage);
    }
  } catch (error) {
    console.error(error);
    const errorMessage =
      "Une erreur s'est produite lors du traitement de la transaction. Veuillez réessayer plus tard.";
    msg.reply(errorMessage);
  } finally {
    delete transactionSteps[msg.from];
  }
}

module.exports = {
  processPayment,
};
