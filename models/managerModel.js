const mongoose = require("mongoose");
const Admin = require("./adminModel");

const ManagerSchema = mongoose.Schema({
  name: {
    type: String,
    required: [true, "Name is required"],
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true,
  },

  adminID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: Admin,
  },
  password: {
    type: String,
    minlength: [6, "Password must contain 6 letters"],
    required: [true, "Password is required"],
  },

  status: {
    type: String,
    default: "active",
  },

  cardLimit: {
    type: Number,
    default: 1,
  },
  createdDate: {
    type: Date,
    default: Date.now(),
  },
});
mongoose.set("strictQuery", false);

const User = mongoose.model("Manager", ManagerSchema);
module.exports = User;
