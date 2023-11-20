require('dotenv').config(); // Load environment variables from the .env file
const User = require('../models/user.model');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
// const { hasActiveSubscription } = require('./subscription.service')
const JWT_SECRET = process.env.JWT_SECRET; // Remplacez ceci par une clé secrète sécurisée

async function createUser(userData) {
    try {
        const hashedPassword = await bcrypt.hash(userData.password, 10); // Hashage du mot de passe

        const newUser = new User({
            name: userData.name,
            phoneNumber: userData.phoneNumber,
            password: hashedPassword, // Utilisation du mot de passe hashé
        });

        await newUser.save();
        return { success: true, message: 'Utilisateur créé avec succès' };
    } catch (error) {
        return { success: false, error: error.message };
    }
}


async function login(phoneNumber, password) {
    try {
        const user = await User.findOne({ phoneNumber });

        if (!user) {
            return { success: false, message: 'Utilisateur non trouvé' };
        }


        const passwordMatch = await bcrypt.compare(password, user.password);

        if (!passwordMatch) {
            return { success: false, message: 'Mot de passe incorrect' };
        }

        return { success: true, user };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function saveUser(phoneNumber, contactName) {
    try {
        const cleanedPhoneNumber = phoneNumber.replace(/@c\.us$/, "");
        const user = await User.findOne({ "phoneNumber": cleanedPhoneNumber });

        if (!user) {
            // Case 1: User not found, create the user
            await createUser({
                'name': contactName,
                'phoneNumber': cleanedPhoneNumber,
                'password': process.env.DEFAULT_PASSWORD
            });

            return { hasSubscription: false, hasPurchase: false, message: "User created successfully." };
        } else {
            // Case 2: User found, increment engagement
            try {
                user.engagementLevel = (user.engagementLevel || 0) + 1;
                await user.save();
            } catch (error) {
                console.error('Error incrementing user engagement level:', error);
            }

        }
    } catch (error) {
        return { hasSubscription: false, hasPurchase: false, message: "An error occurred.", error: error.message };
    }
}


async function getAllUser(phoneNumber) {
    let query = phoneNumber ? {phoneNumber} : {}; 

    try {
        const users = await User.find(query);
        return { success: true, users };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function getUser(userId) {
    try {
        const user = await User.findById(userId).select('-password').populate('subscriptions.subscription');

        if (!user) {
            return { success: false, message: 'Utilisateur non trouvé' };
        }

        return { success: true, user };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function updateUser(phoneNumber, updatedData) {
    try {
      // Utilisez findOneAndUpdate pour trouver l'utilisateur par phoneNumber et mettre à jour username_ejara
      const updatedUser = await User.findOneAndUpdate(
        { phoneNumber: phoneNumber },
        { $set: { username_ejara: updatedData } },
        { new: true } // Ceci renvoie le document mis à jour plutôt que l'ancien
      );
  
      if (updatedUser) {
        return { success: true, message: 'Utilisateur mis à jour avec succès', user: updatedUser };
    } else {
        return { success: false, message: 'Utilisateur non trouvé' };
    }
    } catch (error) {
        return { success: false, message: 'Erreur lors de la mise à jour de l\'utilisateur' };
    }
  }

function generateAccessToken(userId) {
    return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '1h' });
}

module.exports = {
    createUser,
    login,
    generateAccessToken,
    getAllUser,
    getUser,
    updateUser,
    saveUser
};
