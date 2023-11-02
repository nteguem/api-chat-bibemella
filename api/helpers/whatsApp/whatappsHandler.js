require('dotenv').config(); // Load environment variables from the .env file
const { Client } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const { userExistAndSubscribe } = require('../../services/user.service');
const {AdminCommander} = require("./admin");
const {UserCommander} = require("./user");


const initializeWhatsAppClient = () => {
  const client = new Client({
    puppeteer: {
      args: ['--no-sandbox'],
    },  
    // Configurations du client WhatsApp
  });

  client.on('qr', (qr) => {
    qrcode.generate(qr, { small: true });
  });

  client.on('authenticated', () => {
    console.log('Client is authenticated');
  });

  client.on('ready', () => {
    console.log('Client is ready');
  });

  return client;
};

const handleIncomingMessages = (client) => {
  // Utiliser un objet pour stocker les étapes de transaction en cours pour chaque utilisateur
  const transactionSteps = {};

  client.on('message', async (msg) => {
    const isSubscribe = await userExistAndSubscribe(msg.from);
    if (isSubscribe.success && !msg.isGroupMsg && msg.from != process.env.NUMBER_ADMIN) {
      msg.reply("Étant déjà abonné à l'un de nos forfaits en cours, saisissez l'occasion de tirer parti de nos pronostics VIP pour remporter d'importants gains.");
    }
    else if (msg.from == process.env.NUMBER_ADMIN && !msg.isGroupMsg) {
    await AdminCommander(client,msg,transactionSteps);
    }
    else {
    await UserCommander(msg,transactionSteps);
    }
  });

};




module.exports = {
  initializeWhatsAppClient,
  handleIncomingMessages
};
