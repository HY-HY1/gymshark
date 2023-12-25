const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  orderNumber: { type: String, required: true, unique: true },
  customer: {
    name: { type: String, required: true },
    email: { type: String, required: true },
    // You can add more customer details here as needed
  },
  shippingAddress: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String },
    postalCode: { type: String, required: true },
    country: { type: String, required: true },
    // You can add more shipping address details here as needed
  },
  orderDate: { type: Date, default: Date.now },
  products: [
    {
      productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
      quantity: { type: Number, required: true },
      price: { type: Number, required: true },
      // You can add more product details here as needed
    },
  ],
  orderTotal: { type: Number, required: true },
  // Stripe payment information
  payment: {
    paymentId: { type: String, required: true }, // Stripe Payment Intent or Charge ID
    paymentMethod: { type: String, required: true }, // Stripe Payment Method ID (e.g., card_xxxx)
    paymentStatus: { type: String, required: true }, // Stripe Payment Status (e.g., succeeded, failed)
    // You can add more payment-related details here as needed
  },
  // You can add more order-related information here
});

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
