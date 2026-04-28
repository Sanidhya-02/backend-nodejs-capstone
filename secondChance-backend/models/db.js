// db.js
db.js :
require('dotenv').config();
const { MongoClient } = require('mongodb');

let dbInstance = null;

async function connectToDatabase() {
    if (dbInstance) {
        return dbInstance;
    }

    const client = new MongoClient(process.env.MONGO_URL);

    await client.connect();

    dbInstance = client.db(process.env.MONGO_DB || "secondchance");

    return dbInstance;
}

module.exports = connectToDatabase;
