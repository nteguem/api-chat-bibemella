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

async function getAllEventsUsers(eventId) {
  try {
    const users = await User.find(
      { "participations.eventId": eventId },
      {
        participations: {
          $elemMatch: { eventId: eventId },
        },
        name: 1,
        fullname: 1,
        city: 1,
      }
    )
      .populate({
        path: "participations.packId",
        model: "productservices",
      })
      .exec();
    return { success: true, users };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function getAllEvents(page = 1, limit = 10) {
  try {
    const total = await Events.countDocuments({});
    const events = await Events.find({})
      .populate({
        path: "pack",
        model: "productservices",
      })
      .skip((page - 1) * limit)
      .limit(limit)
      .exec();
    return { success: true, events, total: total };
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

async function addEventToUser(
  phoneNumber,
  addSubscription,
  transaction_id,
  operator
) {
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
      operator: operator,
      packId: addSubscription.packId,
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
  getAllEventsUsers,
};
