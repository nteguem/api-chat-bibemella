require('dotenv').config();
const express = require('express');
const appRoutes = require("./api/routes/index");
const bodyParser = require("body-parser");
const cors = require('cors');
const createError = require("http-errors");
const cookieParser = require("cookie-parser");
const dbConnect = require('./api/config/dbConnect');
const { initializeWhatsAppClient, handleIncomingMessages } = require('./api/helpers//whatsApp/whatappsHandler');


// Connection to MongoDB
dbConnect(); 

// App initialization
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Configure CORS origin
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-Type, Accept, Content-Type, Authorization"
  );
  if (req.method === "OPTIONS") {
    res.header("Access-Control-Allow-Methods", "PUT, POST, PATCH, DELETE, GET");
    return res.status(200).json({});
  }
  next();
});

// Create instance whatapp
const client = initializeWhatsAppClient();

//Handle incoming messages from the chatbot using the modular function.
handleIncomingMessages(client);

// Launch WhatsApp client
client.initialize();



// App Routes
app.use('/api/v1/', appRoutes(client));   

// Custom 404 error handler 
app.use((req, res, next) => {
  next(createError(404, 'Route not found'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  res.status(err.status || 500).json({
    error: {
      status: err.status || 500,
      message: err.message || 'Internal Server Error',
    },
  });
});

// Start the app
app.listen(process.env.PORT || 4000, () => {
  console.log("Server started");
});
