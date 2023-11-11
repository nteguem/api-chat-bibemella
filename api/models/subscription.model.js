const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  description: { type: String, required: true },
  image: { type: String},
  price: { type: Number, required: true },
  type: { type: String, required: true }, // Peut être 'NFT', 'Cours de langue', 'Autre'
  subtype: { type: String }, // Par exemple, 'Anglais', 'Français' pour les cours de langue
  durationInDays: { type: Number }, // Durée en jours (pour les services renouvelables)
  advantage: { type: String }, // Avantage spécifique (pour les produits)
  link: { type: String }, // Lien (pour les produits)
});

const Subscription = mongoose.model('Subscription', subscriptionSchema);

module.exports = Subscription;
