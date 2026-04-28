const express = require('express');
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
const connectToDatabase = require('../models/db');
const router = express.Router();
const { body, validationResult } = require('express-validator');
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

// 🔄 UPDATE USER PROFILE
router.put('/update', async (req, res) => {

    // ✅ Task 2: Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        logger.error('Validation errors', errors.array());
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        // ✅ Task 3: Check email in header
        const email = req.headers.email;

        if (!email) {
            logger.error('Email not found in headers');
            return res.status(400).json({
                error: 'Email not found in headers'
            });
        }

        // ✅ Task 4: Connect DB
        const db = await connectToDatabase();
        const collection = db.collection('users');

        // ✅ Task 5: Find user
        const existingUser = await collection.findOne({ email });

        if (!existingUser) {
            logger.error('User not found');
            return res.status(404).json({
                error: 'User not found'
            });
        }

        // Update fields (lab keeps it simple)
        existingUser.firstName = req.body.name;
        existingUser.updatedAt = new Date();

        // ✅ Task 6: Update DB
        const updatedUser = await collection.findOneAndUpdate(
            { email },
            { $set: existingUser },
            { returnDocument: 'after' }
        );

        // ✅ Task 7: JWT
        const payload = {
            user: {
                id: updatedUser._id.toString()
            }
        };

        const authtoken = jwt.sign(payload, JWT_SECRET);

        logger.info('User updated successfully');

        res.json({ authtoken });

    } catch (e) {
        logger.error(e);
        return res.status(500).send('Internal server error');
    }
});

module.exports = router;