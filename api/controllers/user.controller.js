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

const getAllUser = async (req, res) => {
  let { phoneNumber } = req.body;
  const page = req.query.page;
  const limit = req.query.limit;
  const response = await userService.getAllUserPagination(phoneNumber || null, page, limit);

  if (response.success) {
    res.json({users: response.users, totalCount: response.totalUsers, success: true });
  } else {
    res.status(500).json({ message: 'Erreur lors de la récupération des users', error: response.error });
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
  // console.log('helllloo', req.body)
  const {phoneNumber, ...updatedData} = req.body;
  const response = await userService.updateUser(phoneNumber, updatedData);

  if (response.success) {
    res.json(response.user);
  } else {
    res.status(404).json({ message: response.message });
  }
}

module.exports = {
  createUser,
  loginUser,
  getAllUser,
  getUser,
  updateUser,
};
