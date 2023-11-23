const Events = require("../models/events.model");

async function createEvent(eventData) {
  try {
    const newEvent = new Events(eventData);

    await newEvent.save();
    return { success: true, message: "evenement créée avec succès" };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function getAllEvents() {
  try {
    const events = await Events.find({});
    return { success: true, events };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function findEventById(id) {
  try {
    const event = await Events.findById(id);

    if (!event) {
      return { success: false, message: "Utilisateur non trouvé" };
    }
 
    return { success: true, event };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

module.exports = {
  createEvent,
  getAllEvents,
  findEventById,
};
