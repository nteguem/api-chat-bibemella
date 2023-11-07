const teachingService = require('../services/teaching.service');

const createTeaching = async (req, res) => {
    const teachingData = req.body;

    const response = await teachingService.createTeaching(teachingData);

    if (response.success) {
        res.json({ message: response.message });
    } else {
        res.status(500).json({ message: 'Erreur lors de la création du teaching', error: response.error });
    }
};


const getAllTeachings = async (req, res) => {
    const response = await teachingService.getAllTeachings();

    if (response.success) {
        res.json(response.teachings);
    } else {
        res.status(500).json({ message: 'Erreur lors de la récupération des teachings', error: response.error });
    }
};

const updateTeachings = async (req, res) => {
    const teachingId = req.params.teachingId;
    const updatedData = req.body;
    const response = await teachingService.updateSubscription(teachingId, updatedData);

    if (response.success) {
        res.json(response.teaching);
    } else {
        res.status(404).json({ message: response.message });
    }
};

const deleteTeaching = async (req, res) => {
    const teachingId = req.params.teachingId;
    const response = await teachingService.deleteTeaching(teachingId);

    if (response.success) {
        res.json({ message: response.message });
    } else {
        res.status(404).json({ message: response.message });
    }
};

const addTeachingToTeaching = async (req, res) => {
    const { nameTeaching, price, durationInDay } = req.body; 

    const response = await teachingService.addTeachingToTeaching(nameTeaching, price, durationInDay);

    if (response.success) {
        res.json({ message: response.message });
    } else {
        res.status(500).json({ message: 'Erreur lors de l\'ajout de l\'enseignement', error: response.error });
    }
};


module.exports = {
    createTeaching,
    getAllTeachings,
    updateTeachings,
    deleteTeaching,
    addTeachingToTeaching
};