const mongoose = require("mongoose");

const AdminSchema = mongoose.Schema({
  name: {
    type: String,
    required: [true, "Name is required"],
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true,
  },
  phone: {
    type: Number,
    minlength: [10, "phone number must be 10 digits"],
    required: [true, "Phone number is required"],
  },
  cardLimit: {
    type: Number,
    default: 1,
  },
  password: {
    type: String,
    minlength: [6, "Password must contain 6 letters"],
    required: [true, "Password is required"],
  },
  profileImage: {
    type: String,
  },
  status: {
    type: String,
    default: "active",
  },
  createdDate: {
    type: Date,
    default: Date.now(),
  },
  expiryDate: {
    type: Number,
  },
});
mongoose.set("strictQuery", false);

const Admin = mongoose.model("Admin", AdminSchema);
module.exports = Admin;
