require("dotenv").config();

const Table = require("../models/tableModel");
const Waiter = require("../models/waiterModel");
const Notification = require("../models/notificationModel");
const Order = require("../models/orderModel");

const findWaiterByTableId = async (tableId) => {
  try {
    // Find the table document by _id
    const table = await Table.findById(tableId);
    if (!table) {
      throw new Error("Table not found");
    }

    // Get the tableID from the found table document
    const tableID = table.tableID;

    // Find the waiter who is assigned to this table by tableID
    const waiter = await Waiter.findOne({ assignedTables: { $in: [tableID] } });
    if (!waiter) {
      throw new Error("Waiter not found");
    }

    return waiter;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

const updateWaiterSocketId = async (userId, socketId) => {
  try {
    await Waiter.findOneAndUpdate(
      { _id: userId },
      { socketId: socketId },
      { new: true }
    );
  } catch (error) {
    console.log(error);
  }
};

const sendMessage = async (type, message, orderId) => {
  try {
    // Create a new notification
    const notification = new Notification({
      type,
      message,
      orderId,
    });

    // Save the notification to the database
    await notification.save();
  } catch (error) {
    console.error(error);
  }
};

const updateOrderStatus = async (orderId, status) => {
  try {
    // Find the order by _id and update its status
    const updatedOrder = await Order.findOneAndUpdate(
      { _id: orderId },
      { status: status },
      { new: true }
    );

    console.log("Updated order:", updatedOrder);
  } catch (error) {
    console.error(error);
  }
};

module.exports = {
  findWaiterByTableId,
  updateWaiterSocketId,
  sendMessage,
  updateOrderStatus,
};
