const express = require('express');
const router = express.Router();
const connectToDatabase = require('../models/db');

router.get('/', async (req, res) => {
    try {
        // ✅ Task 1: Connect to DB
        const db = await connectToDatabase();
        const collection = db.collection('secondChanceItems');

        // ✅ Create dynamic query object
        let query = {};

        // ✅ Task 2: Name filter (IMPORTANT)
        if (req.query.name && req.query.name.trim() !== '') {
            query.name = { $regex: req.query.name, $options: 'i' };
        }

        // ✅ Task 3: Other filters
        if (req.query.category) {
            query.category = req.query.category;
        }

        if (req.query.condition) {
            query.condition = req.query.condition;
        }

        if (req.query.age_years) {
            query.age_years = { $lte: parseInt(req.query.age_years) };
        }

        // ✅ Task 4: Fetch data
        const items = await collection.find(query).toArray();

        res.json(items);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Search failed' });
    }
});

module.exports = router;