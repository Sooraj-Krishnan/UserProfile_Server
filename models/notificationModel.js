const mongoose = require("mongoose");

const NotificationSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["waiter", "manager", "kitchenStaff"],
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Order",
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Notification", NotificationSchema);
