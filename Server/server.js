require('dotenv').config()

const URL = process.env.URL

const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_PRIVATE);
const cors = require('cors');
const bcrypt = require('bcrypt'); 
const app = express();
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken')

const authenticateUser = require('./routes/auth');
const RouterOrder = require('./routes/order')

const User = require('./models/users');
const Order = require('./models/order'); 
const payments = require('./models/payments')
const product = require('./models/product')


const secretKey =  process.env.SECRET;

app.use(cors());
app.use(express.json());

const port =  process.env.PORT;
const mongoURL = process.env.MONGO_URL;

async function runDB() {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/GymsharkBasketReact');
    console.log('connected to mongoose');
    app.listen(port, () => {
      console.log(`server listening on ${port}`);
    });
  } catch (err) {
    console.error(err);
    
  }
}

runDB();

// Handle payments and orders

app.post('/create-checkout-session', async (req, res) => {
  const { amount, productName, customerEmail, billing_address_collection } = req.body;

  try {
    // Create a Stripe Checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'GBP',
            product_data: {
              name: productName, // Use the actual product name here
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      customer_email: customerEmail, // Use the provided customer email
      client_reference_id: `order_UK12345`,
      billing_address_collection: 'auto',
      shipping_address_collection: {
        allowed_countries: ['GB'],
      },
      mode: 'payment',
      success_url: `http://${URL}:3000/success`,
      cancel_url: `http://${URL}:3000/failed`,
    });

    // Create the payment data object
    const paymentData = new payments({
      sessionId: session.id,
      amount: amount,
      productName: productName,
      customerEmail: customerEmail,
      billingAddress: billing_address_collection,
    });

    // Send the response with the session ID
    res.json({ id: session.id, paymentData });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.use('/order', RouterOrder )


//Handle account Functions

app.use('/', authenticateUser);
  
authenticateUser.get('/', async (req, res) => {
  try {
    const token = req.headers.authorization; // Token from the request
    
    const decodedToken = jwt.verify(token.replace('Bearer ', ''), secretKey); // Verify Token

    const userEmail = decodedToken.email; // Email of the authenticated user
  
    // Fetch the user's name and email from the database using the userEmail
    const user = await User.findOne({ email: userEmail }, 'name email');
  
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
  
    res.status(200).json({ name: user.name, email: user.email });
  } catch (err) {
    res.status(500).json({ error: err.message });
    }
  });
  

authenticateUser.delete('/user/delete/:email', async (req, res) => {
  try {
    const token = req.headers.authorization; // Token from the request
  
    const decodedToken = jwt.verify(token.replace('Bearer ', ''), secretKey);
  
    const userEmail = decodedToken.email; // Email of the authenticated user
  
    if (userEmail !== req.params.email) {
      return res.status(403).json({ message: 'Forbidden' });
    }
  
    const deletedUser = await User.findOneAndDelete({ email: userEmail });
  
    if (!deletedUser) {
      return res.status(404).json({ message: 'User not found' });
    }
  
    res.status(200).json({ message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err});
  }
});


app.post('/login', async (req, res) => {
   try {
      const { email, password } = req.body;
  
      const existingUser = await User.findOne({ email });
  
      if (!existingUser) {
        return res.status(404).json({ message: "User Not found" });
      }
  
      const passwordMatch = await bcrypt.compare(password, existingUser.password);
  
      if (!passwordMatch) {
        return res.status(401).json({ message: "Invalid Password" });
      }
      // Create a JWT token with user's email and name as payload
      const tokenPayload = {
        email: existingUser.email,
        name: existingUser.name || '',
      };
      
      const token = jwt.sign(tokenPayload, secretKey, { expiresIn: '1h' }); // Token expires in 1 hour
  
      res.json({ success: "Logged in", token, tokenPayload });
    } catch (err) {
      console.error(err);
      res.status(500).send("Internal Server Error");
    }
  });

  app.post('/signup', async (req, res) => {
    try {
      const { email, password, name } = req.body;
  
      // Password validation
      //const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/;
      //if (!passwordRegex.test(password)) {
        //return res.status(400).json({
         // message: "Password must contain at least one lowercase letter, one uppercase letter, one number, and be at least 8 characters long.",
        //});
      //}
  
      // Email validation
      const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          message: "Invalid email format. Please provide a valid email address.",
        });
      }
  
      const existingUser = await User.findOne({ email });
  
      if (existingUser) {
        return res.status(404).json({ message: "User exists" });
      }
  
      const hashedPassword = await bcrypt.hash(password, 10);
  
      const tokenPayload = {
        email,
        name: name || '',
      };
  
      const user = new User({
        email,
        password: hashedPassword,
        name,
      });
  
      await user.save();
  
      const token = jwt.sign(tokenPayload, secretKey, { expiresIn: '1h' });
  
      res.json({ success: "signed up", token });
  
    } catch (err) {
      console.error(err);
      res.status(500).send("Internal Server Error");
    }
  });


//Product API - send products to the client

app.get('/product', async (req, res) => { // all products
  try {
      const products = await product.find({})
      res.send(products)

    } catch (err) {
      console.error(err)
      res.send(500).json({ message: "Internal Server Error" })
    }
})

app.get('/product/:id', async (req, res) => { //Product by id
  try {
      const productId = parseInt(req.params.id); // Parse the product ID as an integer
  
      // Use the 'findOne' method to fetch the product by integer ID
      const Product = await product.findOne({ id: productId });
  
      if (!Product) {
        return res.status(404).json({ message: 'Product not found' });
      }
  
      res.json(Product);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  } )

  app.get('/search/products', async (req, res) => { //Product by search
    try {
      const searchTerm = req.query.q; // Get the search term from the query string
      const results = await product.find({
        name: { $regex: new RegExp(searchTerm, 'i') }, // Case-insensitive search
      });
  
      res.json(results);
    } catch (error) {
      console.error('Error searching for products:', error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
});

  