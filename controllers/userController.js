const userService = require('../services/userService');

const addUser = async (req, res) => {
  
  try {
    const { name, email, password } = req.body;
    // console.log(req.body);
    const newUser = await userService.createUser({ name, email, password });
    res.status(201).json(newUser);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create user' });
  }
};

module.exports = { addUser };

