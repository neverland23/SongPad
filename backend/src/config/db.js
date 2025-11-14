const mongoose = require('mongoose');

const mongoUri = {
  development: process.env.MONGO_URI_DEV,
  staging: process.env.MONGO_URI_STAGE,
  production: process.env.MONGO_URI_PRODUCTION,
}[process.env.NODE_ENV];

const connectDB = async () => {
  try {
    const uri = mongoUri || 'mongodb://localhost:27017/voip_dashboard';
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected');
  } catch (err) {
    console.error('MongoDB connection error', err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
