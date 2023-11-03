require('dotenv').config(); // Charger les variables d'environnement depuis le fichier .env

const welcomeStatusUser = {};

const UserCommander = async (msg, transactionSteps) => {
    if (!welcomeStatusUser[msg.from]) {
      const contact = await msg.getContact();
      // Envoyer le message de bienvenue la première fois
        const welcomeMessage = `🌍 Salut ${contact.pushname} et bienvenue à la Fondation Bibemella, le temple de la Culture Africaine. Explorez nos services exceptionnels pour une expérience unique :

        1️⃣ Pour recevoir nos enseignements , tapez 1.
        2️⃣ Pour découvrir notre collection d'objets d'art numérique (NFTs), tapez 2.
        3️⃣ Pour en savoir plus sur notre Wellness Center et nos journées sportives, tapez 3.
        
        Nous sommes là pour vous aider à vous immerger dans la culture africaine et à répondre à vos besoins. Tapez simplement le numéro correspondant pour commencer. Comment pouvons-nous vous assister aujourd'hui ? 🤝`;
        msg.reply(welcomeMessage);
  
        // Enregistrer l'état de bienvenue pour cet utilisateur
        welcomeStatusUser[msg.from] = true;
      } else if (!msg.isGroupMsg) {
        const invalidRequestMessage = `Bot en cours de developpement pour repondre a tout ces services ulterieurement.`;
        msg.reply(invalidRequestMessage); 
        }
      
       else {
        const invalidRequestMessage = `Bot en cours de developpement pour repondre a tout ces services ulterieurement.`;
        msg.reply(invalidRequestMessage); 
      }
};



module.exports = {
    UserCommander,
};
