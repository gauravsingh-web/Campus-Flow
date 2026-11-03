const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

let memoryServer = null;

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/campusflow';
  
  try {
    console.log(`[DB] Attempting connection to MongoDB at: ${uri}`);
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 3000,
      dbName: 'campusflow',
    });
    console.log(`[DB] Successfully connected to MongoDB: ${mongoose.connection.host}`);
  } catch (err) {
    console.warn(`[DB] Local/Configured MongoDB connection failed (${err.message}).`);
    console.log('[DB] Launching embedded MongoDB with persistent storage in data/db...');
    
    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const dbPath = path.resolve(__dirname, '../../../data/db');
      if (!fs.existsSync(dbPath)) {
        fs.mkdirSync(dbPath, { recursive: true });
      }

      memoryServer = await MongoMemoryServer.create({
        instance: {
          dbPath,
          storageEngine: 'wiredTiger',
          dbName: 'campusflow',
        },
      });
      const memUri = memoryServer.getUri();
      await mongoose.connect(memUri, { dbName: 'campusflow' });
      console.log(`[DB] Connected to persistent embedded MongoDB at: ${memUri} (path: ${dbPath})`);
    } catch (memErr) {
      console.error('[DB] Critical error starting persistent database fallback:', memErr);
      process.exit(1);
    }
  }
};

const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    if (memoryServer) {
      await memoryServer.stop();
    }
    console.log('[DB] Database disconnected.');
  } catch (error) {
    console.error('[DB] Error during disconnect:', error);
  }
};

module.exports = { connectDB, disconnectDB };
