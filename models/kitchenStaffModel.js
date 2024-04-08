const mongoose = require("mongoose");
const Admin = require("./adminModel");
const Manager = require("./managerModel");
const MenuCard = require("./menuCardModel");

const KitchenStaffSchema = mongoose.Schema({
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
  managerID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: Manager,
  },

  menuCardID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: MenuCard,
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

  createdDate: {
    type: Date,
    default: Date.now(),
  },
});
mongoose.set("strictQuery", false);

const KitchenStaff = mongoose.model("KitchenStaff", KitchenStaffSchema);
module.exports = KitchenStaff;
