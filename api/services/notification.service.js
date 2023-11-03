const Notification = require('../models/notification.model');
const moment = require('moment'); 


async function createNotification(notificationData) {
  try {
    const newNotification = new Notification(notificationData);
    await newNotification.save();
    return { success: true, message: 'Notification créé avec succès' };
  } catch (error) {
    return { success: false, error: error.message };
  }
}


async function findActiveNotification() {
    try {
      const today = moment().startOf('day'); 
      const notification = await Notification.findOne({
        date: { $gte: today.toDate(), $lt: moment(today).endOf('day').toDate() }
      }).exec();
      return notification || null;
    } catch (error) {
      console.error('Erreur lors de la recherche de la notification :', error);
      throw error;
    }
  }
  
module.exports = {
  createNotification,
  findActiveNotification,
};
