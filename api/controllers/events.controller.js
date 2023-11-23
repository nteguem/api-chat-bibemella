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
          "public/assets/preview"
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
          "public/assets/gallery"
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
        pack: fields?.pack,
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
        console.log(response.error)
      }
    });
  } catch (error) {
    res.status(400).json({ success: false });
  }
};

const getAllEvents = async (req, res) => {
  const response = await eventService.getAllEvents();

  if (response.success) {
    res.json(response.events);
  } else {
    res.status(500).json({
      message: "Erreur lors de la récupération des produit",
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
          "public/assets/preview"
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
          "public/assets/gallery"
        );
        if (url) gallery.push(url);
      }

      // Get the event ID from the request parameters or body
      const eventId = req.params.id || fields.id;

      if (!eventId) {
        return res.status(400).json({ success: false, message: "Event ID is required" });
      }

      // Find the event by ID
      const responseEvent = await eventService.findEventById(eventId);

      if (!responseEvent.success) {
        return res.status(404).json({ success: false, message: "Event not found" });
      }
      console.log(responseEvent)
      let existingEvent = responseEvent.event;
      // Update the event fields
      existingEvent.name = fields.name || existingEvent.name;
      existingEvent.previewImage = fields.preview || existingEvent.previewImage;
      existingEvent.description = fields.description || existingEvent.description;
      existingEvent.date = fields.date || existingEvent.date;
      existingEvent.time = fields.time || existingEvent.time;
      existingEvent.place = fields.place || existingEvent.place;
      existingEvent.pack = fields.pack || existingEvent.pack;

      if (gallery.length > 0) {
        existingEvent.gallery = existingEvent.gallery ? existingEvent.gallery.concat(gallery) : gallery;
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


module.exports = {
  createEvent,
  getAllEvents,
  updateEvent,
};