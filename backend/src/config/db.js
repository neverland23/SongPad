const mongoose = require('mongoose');

const mongoUri = {
  development: process.env.MONGO_DEV_URI,
  staging: process.env.MONGO_STAGE_URI,
  production: process.env.MONGO_PRODUCTION_URI,
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
