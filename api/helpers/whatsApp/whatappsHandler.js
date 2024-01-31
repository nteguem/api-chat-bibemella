const { Client, LocalAuth } = require('whatsapp-web.js');
const { saveUser, getAllUser } = require('../../services/user.service');
const { AdminCommander } = require("./admin");
const { UserCommander } = require("./user");

const initializeWhatsAppClient = (io) => {
  const client = new Client({
    puppeteer: {
      args: ['--no-sandbox'],
      // executablePath: '/usr/bin/google-chrome-stable',
    },
    authStrategy: new LocalAuth(
      {
        dataPath: '../sessions'
      }
    ),
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
    io.emit('numberBot', `${client.info?.wid?.user} (${client.info?.pushname})`);
    io.emit('qrCode', "connected");
  });

  client.on('disconnected', () => {
    io.emit('qrCode', "disconnected");
    io.emit('numberBot', "");
    // Sauvegarde de la session localement avant de réinitialiser
    client.authInfo && client.authInfo.saveSession && client.authInfo.saveSession();
    client.initialize();
  });

  return client;
};

const handleIncomingMessages = (client) => {
  const transactionSteps = {};

  client.on('message', async (msg) => {
    const contact = await msg.getContact();
    const contactName = contact.pushname;
    if(msg.from.replace(/@c\.us$/, "") !== 'status@broadcast'){
      await saveUser(msg.from, contactName);
    }

    let response = await getAllUser(msg.from.replace(/@c\.us$/, ""));
    let user = response?.users[0];
    transactionSteps.userType = user?.role || 'user';

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
