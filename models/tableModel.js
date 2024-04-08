const mongoose = require("mongoose");
const Admin = require("./adminModel");
const Manager = require("./managerModel");
const MenuCard = require("./menuCardModel");

const TableSchema = mongoose.Schema({
  tableID: {
    type: String,
    required: [true, "ID is required"],
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
  QRCode: {
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
});
mongoose.set("strictQuery", false);

const Table = mongoose.model("Table", TableSchema);
module.exports = Table;
