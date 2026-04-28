const express = require('express');
const multer = require('multer');
const router = express.Router();
const connectToDatabase = require('../models/db');
const logger = require('../logger');

// Define upload directory
const directoryPath = 'public/images';

// Multer storage config
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, directoryPath);
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});

const upload = multer({ storage: storage });


// ✅ GET all items
router.get('/', async (req, res, next) => {
    logger.info('GET all items');
    try {
        const db = await connectToDatabase();
        const collection = db.collection("secondChanceItems");

        const secondChanceItems = await collection.find({}).toArray();

        res.json(secondChanceItems);
    } catch (e) {
        console.error(e);
        next(e);
    }
});


// ✅ POST new item
router.post('/', upload.single('file'), async (req, res, next) => {
    try {
        const db = await connectToDatabase();
        const collection = db.collection("secondChanceItems");

        let secondChanceItem = req.body;

        // Generate new ID
        const lastItemQuery = await collection.find().sort({ id: -1 }).limit(1);

        let newId = 1;
        const lastItem = await collection.find().sort({ id: -1 }).limit(1).toArray();
        if (lastItem.length > 0) {
            newId = parseInt(lastItem[0].id) + 1;
        }

        secondChanceItem.id = newId.toString();

        // Add timestamp
        secondChanceItem.date_added = Math.floor(new Date().getTime() / 1000);

        // Handle image
        if (req.file) {
            secondChanceItem.image = req.file.filename;
        }

        await collection.insertOne(secondChanceItem);

        res.status(201).json(secondChanceItem);

    } catch (e) {
        console.error(e);
        next(e);
    }
});


// ✅ GET item by ID
router.get('/:id', async (req, res, next) => {
    try {
        const db = await connectToDatabase();
        const collection = db.collection("secondChanceItems");

        const id = req.params.id;

        const item = await collection.findOne({ id });

        if (!item) {
            return res.status(404).send("secondChanceItem not found");
        }

        res.json(item);

    } catch (e) {
        next(e);
    }
});


// ✅ UPDATE item
router.put('/:id', async (req, res, next) => {
    try {
        const db = await connectToDatabase();
        const collection = db.collection("secondChanceItems");

        const id = req.params.id;

        const item = await collection.findOne({ id });

        if (!item) {
            return res.status(404).json({ error: "secondChanceItem not found" });
        }

        // Update fields
        item.category = req.body.category;
        item.condition = req.body.condition;
        item.age_days = req.body.age_days;
        item.description = req.body.description;

        item.age_years = Number((item.age_days / 365).toFixed(1));
        item.updatedAt = new Date();

        const updated = await collection.findOneAndUpdate(
            { id },
            { $set: item },
            { returnDocument: 'after' }
        );

        if (updated) {
            res.json({ uploaded: "success" });
        } else {
            res.json({ uploaded: "failed" });
        }

    } catch (e) {
        next(e);
    }
});


// ✅ DELETE item
router.delete('/:id', async (req, res, next) => {
    try {
        const db = await connectToDatabase();
        const collection = db.collection("secondChanceItems");

        const id = req.params.id;

        const item = await collection.findOne({ id });

        if (!item) {
            return res.status(404).json({ error: "secondChanceItem not found" });
        }

        await collection.deleteOne({ id });

        res.json({ message: "Item deleted" });

    } catch (e) {
        next(e);
    }
});

module.exports = router;
