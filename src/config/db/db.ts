import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/CPM';

mongoose.connect(mongoURI)
  .then(() => {
    console.log('Database connected successfully!');
  })
  .catch((err: Error) => {
    console.error(`Database connection error: ${err.message}`);
    process.exit(1); 
  });

// Handle connection events
const db = mongoose.connection;

// Connection success
db.on('connected', () => {
  console.log('Mongoose connection established.');
});

// Handle connection errors
db.on('error', (err: Error) => {
  console.error(`Mongoose connection error: ${err.message}`);
});

// Handle connection disconnection
db.on('disconnected', () => {
  console.log('Mongoose connection disconnected.');
});

export default db;






