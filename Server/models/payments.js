const mongoose = require('mongoose');

const paymentsSchema = new mongoose.Schema({
  sessionId: { type: String, required: true },
  amount: { type: Number, required: true },
  productName: { type: String, required: true },
  orderDateTime: { type: Date, required: true },
  billingAddress: { type: String }, // Change to appropriate data type if needed
  customerEmail: { type: String, required: true },
});

module.exports = mongoose.model('payments', paymentsSchema);
