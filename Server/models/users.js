const mongoose = require('mongoose');

const user = new mongoose.Schema({
    email: {unique: true, type: String, required: true},
    password: {type: String, required: true},
    name: {type: String}
})

module.exports = mongoose.model("User", user)