const express = require('express');
const router = express.Router();
const Order = require('../models/order'); // Import your order model

router.post('/order', async (req, res) => {

    res.send('in order')
  
});

module.exports = router;