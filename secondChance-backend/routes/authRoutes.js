const express = require('express');
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
const connectToDatabase = require('../models/db');
const router = express.Router();
require('dotenv').config();
const pino = require('pino');

const logger = pino();
const JWT_SECRET = process.env.JWT_SECRET;

router.post('/register', async (req, res) => {
    try {
        // ✅ Task 1: Connect DB
        const db = await connectToDatabase();

        // ✅ Task 2: Users collection
        const collection = db.collection('users');

        // ✅ Task 3: Check existing user
        const existingEmail = await collection.findOne({
            email: req.body.email
        });

        if (existingEmail) {
            logger.error('Email id already exists');
            return res.status(400).json({
                error: 'Email id already exists'
            });
        }

        // ✅ Task 4: Hash password
        const salt = await bcryptjs.genSalt(10);
        const hash = await bcryptjs.hash(req.body.password, salt);

        // ✅ Task 5: Insert user
        const newUser = await collection.insertOne({
            email: req.body.email,
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            password: hash,
            createdAt: new Date()
        });

        // ✅ Task 6: JWT
        const payload = {
            user: {
                id: newUser.insertedId
            }
        };

        const authtoken = jwt.sign(payload, JWT_SECRET);

        // ✅ Task 7: Log
        logger.info('User registered successfully');

        // ✅ Task 8: Response
        res.json({
            authtoken,
            email: req.body.email
        });

    } catch (e) {
        logger.error(e);
        res.status(500).send('Internal server error');
    }
});

// 🔐 LOGIN ENDPOINT
router.post('/login', async (req, res) => {
    try {
        // ✅ Task 1: Connect DB
        const db = await connectToDatabase();

        // ✅ Task 2: Users collection
        const collection = db.collection('users');

        // ✅ Task 3: Find user
        const theUser = await collection.findOne({
            email: req.body.email
        });

        // ✅ Task 7: User not found
        if (!theUser) {
            logger.error('User not found');
            return res.status(404).json({
                error: 'User not found'
            });
        }

        // ✅ Task 4: Compare password
        const isMatch = await bcryptjs.compare(
            req.body.password,
            theUser.password
        );

        if (!isMatch) {
            logger.error('Passwords do not match');
            return res.status(400).json({
                error: 'Wrong password'
            });
        }

        // ✅ Task 5: Fetch details
        const userName = theUser.firstName;
        const userEmail = theUser.email;

        // ✅ Task 6: JWT
        const payload = {
            user: {
                id: theUser._id.toString()
            }
        };

        const authtoken = jwt.sign(payload, JWT_SECRET);

        logger.info('User logged in successfully');

        res.json({
            authtoken,
            userName,
            userEmail
        });

    } catch (e) {
        logger.error(e);
        return res.status(500).json({
            error: 'Internal server error'
        });
    }
});

module.exports = router;