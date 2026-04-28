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

module.exports = router;