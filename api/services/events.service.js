const Events = require("../models/events.model");
const User = require("../models/user.model");

async function createEvent(eventData) {
  try {
    const newEvent = new Events(eventData);

    await newEvent.save();
    return { success: true, message: "evenement créée avec succès" };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function getAllEventsUsers (eventId){
  try{
    const users = await User.find(
        { 'participations.eventId': eventId }
    );
    return { success: true, users };
  }catch (error) {
    return { success: false, error: error.message };
  }
}

async function getAllEvents() {
  try {
    const events = await Events.find({}).populate({
            path: 'pack',
            model: 'productservices',
        });
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

async function addEventToUser(phoneNumber, addSubscription, transaction_id, operator) {
  try {
    
    const user = await User.findOne({ phoneNumber });
    const product = await Events.findOne({
      _id: addSubscription.itemId,
    });

    if (!user || !product) {
      return {
        success: false,
        message: "Utilisateur ou evenement non trouvé",
      };
    }

    user.participations.push({
      eventId: addSubscription.itemId,
      transaction_id: transaction_id,
      operator: operator
    });

    await user.save();

    const addedEvent = await Events.findById(product._id);

    return {
      success: true,
      message: "Souscription ajoutée avec succès",
      subscription: addedEvent,
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// eventService.js

const deleteEvent = async (eventId) => {
  try {
  
    const result = await Events.findByIdAndDelete(eventId);
    return { success: true };
  } catch (error) {
    console.error("Error deleting event:", error);
    return { success: false, error: "Error deleting event" };
  }
};


module.exports = {
  createEvent,
  getAllEvents,
  findEventById,
  addEventToUser,
  deleteEvent,
  getAllEventsUsers
};
