const mongoose = require("mongoose");
const uri = process.env.URI;

const connectDb = async () => {
  try {
    await mongoose.connect(uri);
    console.log("MongoDB connected");
  } catch (error) {
    console.log("MongoDB connection failed : ", error);
    process.exit(1);
  }
};

module.exports = { connectDb };
