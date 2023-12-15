require('dotenv').config(); // Load environment variables from the .env file
const { Client } = require('whatsapp-web.js');
const { saveUser, getAllUser } = require('../../services/user.service');
const { AdminCommander } = require("./admin");
const { UserCommander } = require("./user");


const initializeWhatsAppClient = (io) => {
  const client = new Client({
    puppeteer: {
      args: ['--no-sandbox'],
    },
    // Configurations du client WhatsApp
  });

  client.on('qr', (qrCode) => {
    io.emit('qrCode', qrCode);
  });

  client.on('authenticated', () => {
    io.emit('qrCode', "");
    console.log('Client is authenticated');
  });

  client.on('ready', () => {
    console.log('Client is ready');
    io.emit('qrCode', "");
  });

  return client;
};

const handleIncomingMessages = (client) => {
  // Utiliser un objet pour stocker les étapes de transaction en cours pour chaque utilisateur
  const transactionSteps = {};

  client.on('message', async (msg) => {
    const contact = await msg.getContact();
    const contactName = contact.pushname; // Récupérer le nom de l'utilisateur
    await saveUser(msg.from, contactName);
    //  if (!transactionSteps?.userType) {
    let response = await getAllUser(msg.from.replace(/@c\.us$/, ""));
    let user = response.users[0];
    transactionSteps.userType = user?.role || 'user';
    // }

    if (transactionSteps.userType === 'admin' && !msg.isGroupMsg) {
      await AdminCommander(client, msg, transactionSteps);
    }
    else {
      await UserCommander(client, msg, transactionSteps);
    }
  });
};



module.exports = {
  initializeWhatsAppClient,
  handleIncomingMessages
};