require('dotenv').config(); // Charger les variables d'environnement depuis le fichier .env
const { MessageMedia } = require('whatsapp-web.js');

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
      } else if (!msg.isGroupMsg && msg.body == '2') {
         // L'utilisateur souhaite acheter une œuvre d'art.
    // Vous pouvez envoyer les détails des œuvres d'art disponibles avec des liens d'images, des noms, des descriptions et des prix.
    const artDetails = [
      { name: 'Œuvre 1', description: 'Description de l\'œuvre 1', price: '$100', imageUrl: 'https://res.cloudinary.com/nwccompany/image/upload/v1699090007/ekema.png' },
      { name: 'Œuvre 2', description: 'Description de l\'œuvre 2', price: '$150', imageUrl: 'https://res.cloudinary.com/nwccompany/image/upload/v1699090007/mbom.png' },
      // Ajoutez d'autres œuvres d'art ici.
    ];

    for (let i = 0; i < artDetails.length; i++) {
      const art = artDetails[i];
      const media = await MessageMedia.fromUrl(art.imageUrl);
      await msg.reply(media);
    }
        }
      
       else {
        const invalidRequestMessage = `Bot en cours de developpement pour repondre a tout ces services ulterieurement.`;
        msg.reply(invalidRequestMessage); 
      }
};



module.exports = {
    UserCommander,
};
