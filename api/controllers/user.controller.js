const userService = require('../services/user.service');

const createUser = async (req, res) => {
    const userData = req.body;
    const response = await userService.createUser(userData);
    
    if (response.success) {
      res.json({ message: response.message });
    } else {
      res.status(500).json({ message: 'Erreur lors de la création de l\'utilisateur', error: response.error });
    }
  };

const loginUser = async (req, res) => {
  const { phoneNumber, password } = req.body;
  const response = await userService.login(phoneNumber, password);
  
  if (response.success) {
    const token = userService.generateAccessToken(response.user._id);
    res.json({ token, user: response.user });
  } else {
    res.status(401).json(response);
  }
};

const getUser = async (req, res) => {
    const userId = req.params.userId;
    const response = await userService.getUser(userId);
    
    if (response.success) {
      res.json(response.user);
    } else {
      res.status(404).json({ message: response.message });
    }
  };
  
  const updateUser = async (req, res) => {
    const userId = req.params.userId;
    const updatedData = req.body;
    const response = await userService.updateUser(userId, updatedData);
    
    if (response.success) {
      res.json(response.user);
    } else {
      res.status(404).json({ message: response.message });
    }
  };

module.exports = {
  createUser,
  loginUser,
  getUser,
  updateUser,
};
