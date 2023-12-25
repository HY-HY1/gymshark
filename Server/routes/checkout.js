const express = require('express')
const routerCheckout = express.Router()

routerCheckout.get('/checkout', (req, res) => {
    res.send('in checkout')
})

module.exports = routerCheckout;