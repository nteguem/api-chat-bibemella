const Teaching = require('../models/teaching.model')

async function createTeaching(teachingData) {
    try {
        const newTeaching = new Teaching(teachingData);
        await newTeaching.save();
        return { success: true, message: 'Enseignement créé avec succès' };
      } catch (error) {
        return { success: false, error: error.message };
      }
}

async function getAllTeachings() { 
    try {
        const teachings = await Teaching.find();
        return { success: true, teachings };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function updateTeaching(teachingId, updatedData) {
    try {
        const updatedTeaching = await Teaching.findByIdAndUpdate(teachingId, updatedData, { new: true });

        if (!updatedTeaching) {
            return { success: false, message: 'Enseignement non trouvé' };
        }

        return { success: true, subscription: updatedTeaching };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function deleteTeaching(teachingId) {
    try {
        const deleteTeaching = await Teaching.findByIdAndDelete(teachingId);

        if (!deleteTeaching) {
            return { success: false, message: 'Enseignement non trouvé' };
        }

        return { success: true, message: 'Enseignement supprimé avec succès' };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function addTeachingToTeaching(name, price, durationInDay) {
    try {
        // Rechercher l'enseignement par son nom
        const teaching = await Teaching.findOne({ 'name.name': name });

        if (!teaching) {
            return { success: false, message: 'Enseignement non trouvé' };
        }

        // Ajouter le nouvel enseignement aux données existantes
        teaching.name.push({
            name,
            price,
            durationInDay
        });

        // Enregistrer les modifications
        await teaching.save();

        return { success: true, message: 'Enseignement ajouté avec succès' };
    } catch (error) {
        return { success: false, error: error.message };
    }
}


module.exports = {
    createTeaching,
    getAllTeachings,
    updateTeaching,
    deleteTeaching,
    addTeachingToTeaching
};
