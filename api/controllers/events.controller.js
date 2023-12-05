const uploadFileWithFormidable = require("../helpers/uploadCloudinary");
const eventService = require("../services/events.service");
const formidable = require("formidable-serverless");

const createEvent = async (req, res) => {
  try {
    const form = new formidable.IncomingForm({ multiples: true });

    form.parse(req, async (err, fields, files) => {
      if (files && files.preview && files.preview.name) {
        const url = await uploadFileWithFormidable(
          files.preview,
          "preview"
        );
        if (url) {
          fields.preview = url;
        }
      }

      const gallery = [];
      let imageFiles = files ? files["gallery[]"] : [];
      if (!Array.isArray(imageFiles)) imageFiles = [imageFiles];

      for (let image of imageFiles) {
        const url = await uploadFileWithFormidable(
          image,
          "gallery"
        );
        if (url) gallery.push(url);
      }

      //   if (gallery.length > 0) fields.images = user.images?.concat(images); we can concat only in the update

      let eventData = {
        name: fields.name,
        previewImage: fields.preview,
        description: fields.description,
        date: fields?.date,
        time: fields?.time,
        place: fields?.place,
        pack: JSON.parse(fields?.pack),
        gallery: gallery,
      };

      const response = await eventService.createEvent(eventData);

      if (response.success) {
        res.json({ message: response.message });
      } else {
        res.status(500).json({
          message: "Erreur lors de la création de l'evenement",
          error: response.error,
        });
      }
    });
  } catch (error) {
    res.status(400).json({ success: false });
  }
};

const getAllEvents = async (req, res) => {
  const page = req.query.page;
  const limit = req.query.limit;
  const response = await eventService.getAllEvents(page, limit);

  if (response.success) {
    res.json({events: response.events, total: response.total, success: true});
  } else {
    res.status(500).json({
      message: "Erreur lors de la récupération des produit",
      error: response.error,
    });
  }
};

const getAllEventsUsers = async (req, res) => {
  const eventId = req.params.id || fields.id;
  const response = await eventService.getAllEventsUsers(eventId);

  if (response.success) {
    res.json(response.users);
  } else {
    res.status(500).json({
      message: "Erreur lors de la récupération des utilisateurs",
      error: response.error,
    });
  }
};

const updateEvent = async (req, res) => {
  try {
    const form = new formidable.IncomingForm({ multiples: true });

    form.parse(req, async (err, fields, files) => {
      if (files && files.preview && files.preview.name) {
        const url = await uploadFileWithFormidable(
          files.preview,
          "preview"
        );
        if (url) {
          fields.preview = url;
        }
      }

      const gallery = [];
      let imageFiles = files ? files["gallery"] : [];
      if (!Array.isArray(imageFiles)) imageFiles = [imageFiles];

      for (let image of imageFiles) {
        const url = await uploadFileWithFormidable(
          image,
          "gallery"
        );
        if (url) gallery.push(url);
      }

      // Get the event ID from the request parameters or body
      const eventId = req.params.id || fields.id;

      if (!eventId) {
        return res
          .status(400)
          .json({ success: false, message: "Event ID is required" });
      }

      // Find the event by ID
      const responseEvent = await eventService.findEventById(eventId);

      if (!responseEvent.success) {
        return res
          .status(404)
          .json({ success: false, message: "Event not found" });
      }

      let existingEvent = responseEvent.event;
      // Update the event fields
      existingEvent.name = fields.name || existingEvent.name;
      existingEvent.previewImage = fields.preview || existingEvent.previewImage;
      existingEvent.description =
        fields.description || existingEvent.description;
      existingEvent.date = fields.date || existingEvent.date;
      existingEvent.time = fields.time || existingEvent.time;
      existingEvent.place = fields.place || existingEvent.place;
      existingEvent.pack = JSON.parse(fields.pack) || existingEvent.pack;

      if (gallery.length > 0) {
        existingEvent.gallery = existingEvent.gallery
          ? existingEvent.gallery.concat(gallery)
          : gallery;
      }

      // Save the updated event
      const response = await existingEvent.save();

      if (response) {
        res.json({ message: "Event updated successfully", data: response });
      } else {
        res.status(500).json({
          message: "Error updating the event",
          error: response.error,
        });
      }
    });
  } catch (error) {
    console.error(error);
    res.status(400).json({ success: false });
  }
};

const deleteEvent = async (req, res) => {
  // Extract event ID from request parameters
  const eventId = req.params.id;

  // Call your eventService to delete the event
  const response = await eventService.deleteEvent(eventId);

  if (response.success) {
    res.json({ message: "Event deleted successfully" });
  } else {
    res.status(500).json({
      message: "Error deleting the event",
      error: response.error,
    });
  }
};

const deleteEventImage = async (req, res) => {
  try {
    const eventId = req.params.id;
    const imageUrl = req.body.imageUrl; 

    // Find the event by ID
    const responseEvent = await eventService.findEventById(eventId);

    if (!responseEvent.success) {
      return res
        .status(404)
        .json({ success: false, message: "Event not found" });
    }

    const existingEvent = responseEvent.event;
    const imageIndex = existingEvent.gallery.indexOf(imageUrl);

    if (imageIndex === -1) {
      return res
        .status(404)
        .json({ success: false, message: "Image not found in the gallery" });
    }

    existingEvent.gallery.splice(imageIndex, 1);

    const response = await existingEvent.save();

    if (response) {
      // Optionally, you may want to delete the image file from your storage here
      res.json({ message: "Image deleted successfully", data: response });
    } else {
      res.status(500).json({
        message: "Error deleting the image",
        error: response.error,
      });
    }
  } catch (error) {
    console.error(error);
    res.status(400).json({ success: false });
  }
};



module.exports = {
  createEvent,
  getAllEvents,
  updateEvent,
  deleteEvent,
  getAllEventsUsers,
  deleteEventImage
};
