require("dotenv").config(); // Load environment variables from the .env file
const User = require("../models/user.model");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
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
    return { success: true, message: "Utilisateur créé avec succès" };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function login(phoneNumber, password) {
  try {
    const user = await User.findOne({ phoneNumber });

    if (!user) {
      return { success: false, message: "Utilisateur non trouvé" };
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return { success: false, message: "Mot de passe incorrect" };
    }

    return { success: true, user };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function saveUser(phoneNumber, contactName) {
  try {
    const cleanedPhoneNumber = phoneNumber.replace(/@c\.us$/, "");
    const user = await User.findOne({ phoneNumber: cleanedPhoneNumber });

    if (!user) {
      // Case 1: User not found, create the user
      await createUser({
        name: contactName,
        phoneNumber: cleanedPhoneNumber,
        password: process.env.DEFAULT_PASSWORD,
      });

      return {
        hasSubscription: false,
        hasPurchase: false,
        message: "User created successfully.",
      };
    } else {
      // Case 2: User found, increment engagement
      try {
        user.engagementLevel = (user.engagementLevel || 0) + 1;
        await user.save();
      } catch (error) {
        console.error("Error incrementing user engagement level:", error);
      }
    }
  } catch (error) {
    return {
      hasSubscription: false,
      hasPurchase: false,
      message: "An error occurred.",
      error: error.message,
    };
  }
}

async function getAdminUsers() {
  const users = await User.find({role: 'admin'});
  if(users){
    return { success: true, users: users };
  }else{
    return { success: false, error: 'Error getting admin users' };
  }
}

async function getAllUser(phoneNumber) {
  let query = phoneNumber ? { phoneNumber } : {};

  try {
    const users = await User.find(query)
      .populate({
        path: "subscriptions.productId",
        model: "productservices",
        select: "name subservices", // Add the fields you want to select
      })
      .populate({
        path: "participations.eventId",
        model: "events",
      })
      .populate({
        path: "participations.packId",
        model: "productservices", // Assuming 'ProductService' is the name of the referenced model
      })
      .exec();
    const updatedUsers = users.map((user) => {
      user.subscriptions.forEach((subscription) => {
        if (subscription.productId && subscription.isOption) {
          subscription.productId.subservices =
            subscription.productId.subservices.filter((subservice) =>
              subservice._id.equals(subscription.optionId)
            );
        }
      });
      return user;
    });
    return { success: true, users: updatedUsers };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function getAllUserPagination(phoneNumber, page = 1, limit = 10) {
  let query = phoneNumber ? { phoneNumber } : {};

  try {
    const totalUsers = await User.countDocuments(query);
    const users = await User.find(query)
      .populate({
        path: "subscriptions.productId",
        model: "productservices",
        select: "name subservices", // Add the fields you want to select
      })
      .populate({
        path: "participations.eventId",
        model: "events",
      })
      .populate({
        path: "participations.packId",
        model: "productservices", // Assuming 'ProductService' is the name of the referenced model
      })
      .skip((page - 1) * limit)
      .limit(limit)
      .exec();
    const updatedUsers = users.map((user) => {
      user.subscriptions.forEach((subscription) => {
        if (subscription.productId && subscription.isOption) {
          subscription.productId.subservices =
            subscription.productId.subservices.filter((subservice) =>
              subservice._id.equals(subscription.optionId)
            );
        }
      });
      return user;
    });

    return { success: true, users: updatedUsers, totalUsers: totalUsers };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function getUser(userId) {
  try {
    const user = await User.findById(userId)
      .select("-password")
      .populate("subscriptions.subscription");

    if (!user) {
      return { success: false, message: "Utilisateur non trouvé" };
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
      { $set: updatedData },
      { new: true } // Ceci renvoie le document mis à jour plutôt que l'ancien
    );

    if (updatedUser) {
      return {
        success: true,
        message: "Utilisateur mis à jour avec succès",
        user: updatedUser,
      };
    } else {
      return { success: false, message: "Utilisateur non trouvé" };
    }
  } catch (error) {
    return {
      success: false,
      message: "Erreur lors de la mise à jour de l'utilisateur",
    };
  }
}

function generateAccessToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: "1h" });
}

module.exports = {
  createUser,
  login,
  generateAccessToken,
  getAllUser,
  getUser,
  updateUser,
  saveUser,
  getAllUserPagination,
  getAdminUsers
};
