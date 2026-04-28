
/*jshint esversion: 8 */
require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const pinoHttp = require('pino-http');
const logger = require('./logger');
const connectToDatabase = require('./models/db');

// ✅ Import Routes
const secondChanceItemsRoutes = require('./routes/secondChanceItemsRoutes');
const searchRoutes = require('./routes/searchRoutes');
// (Auth optional for now)
//const authRoutes = require('./routes/authRoutes'); // only if file exists

const app = express();
const port = 3060;

// ✅ Middleware
app.use("*", cors());
app.use(express.json());
app.use(pinoHttp({ logger }));
app.use(express.static(path.join(__dirname, 'public')));

// ✅ Connect to MongoDB
connectToDatabase()
    .then(() => {
        logger.info('Connected to DB');
    })
    .catch((e) => {
        console.error('Failed to connect to DB', e);
    });

// ✅ Use Routes

// Auth (only if implemented)
//app.use('/api/auth', authRoutes);

// Items API (MOST IMPORTANT)
app.use('/api/secondchance/items', secondChanceItemsRoutes);

// Search API
app.use('/api/secondchance/search', searchRoutes);

// ✅ Test route
app.get("/", (req, res) => {
    res.send("Inside the server");
});

// ✅ Global Error Handler
app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).send('Internal Server Error');
});

// ✅ Start server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});