const mongoose = require('mongoose');

const product = new mongoose.Schema({
    id: {type: Number},
    productName: {type: String},
    price: {type: Number},
    productImage: {type: String},
})

module.exports = mongoose.model("product", product)