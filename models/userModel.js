// const mongoose = require('mongoose');

// const userSchema = new mongoose.Schema({
//   name: { type: String, required: true },
//   email: { type: String, required: true, unique: true },
//   password: { type: String, required: true },
// });

// const User = mongoose.model('User', userSchema);

const save = (userData) => {

      let ob = {
        name: 'mike',
        email: '406599358@qq.com',
        msg: '用户成功'
      }
      return  ob
};

module.exports = {
  save
}

