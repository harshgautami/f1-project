const mongoose = require("mongoose");
const { env } = require("./env");

const connectDB = async () => {
  try {
    if (mongoose.connection.readyState === 1) {
      return;
    }

    await mongoose.connect(env.mongoUri);
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection error:", error.message);

    if (!env.isProduction) {
      process.exit(1);
    }

    throw error;
  }
};

module.exports = connectDB;
