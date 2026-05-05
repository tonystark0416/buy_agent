

const user = require('../models/userModel');

const createUser = async (userData) => {
  console.log(userData);
  console.log(user);
   console.log(user.save(userData));
  // const user = new User(userData);
  return await user.save(userData);
};

module.exports = { createUser };

