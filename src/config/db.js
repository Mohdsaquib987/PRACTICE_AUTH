const mongoose = require('mongoose');
const config = require('./config');

const connectDB = async () => {
    try {
        await mongoose.connect(config.MONGO_URI);

        console.log('MongoDB connected');
    } catch (error) {
        console.log('MongoDB connection failed:', error.message);
    }
};

module.exports = connectDB;