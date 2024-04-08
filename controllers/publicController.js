require("dotenv").config();
//const mongoose = require("mongoose");
const MenuCard = require("../models/menuCardModel");
const Table = require("../models/tableModel");
const Order = require("../models/orderModel");
const Waiter = require("../models/waiterModel");
const KitchenStaff = require("../models/kitchenStaffModel");

const menuView = async (req, res, next) => {
  try {
    const tableID = req.params.id;

    const table = await Table.findById(tableID);
    if (!table) {
      return res.status(404).json({
        success: false,
        message: "Table not found",
      });
    }
    const menuCardID = table.menuCardID;
    const menuCard = await MenuCard.findById(menuCardID);

    if (!menuCard) {
      return res.status(404).json({
        success: false,
        message: "Menu card not found",
      });
    }

    res.status(200).json({
      success: true,
      data: menuCard,
    });
  } catch (error) {
    console.error("Detailed Error:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
    next(error);
  }
};

const createOrder = async (req, res, next) => {
  try {
    const tableID = req.params.id;

    const { orders, specialInstructions, totalAmount } = req.body;

    const table = await Table.findById(tableID);
    if (!table) {
      return res.status(404).json({
        success: false,
        message: "Table not found",
      });
    }

    // Find the waiter who is assigned to the table
    const waiter = await Waiter.findOne({ assignedTables: table.tableID });

    if (!waiter) {
      return res.status(404).json({
        success: false,
        message: "Waiter not found",
      });
    }

    // Find the kitchen staff who is assigned to the menu card
    const kitchenStaff = await KitchenStaff.findOne({
      menuCardID: table.menuCardID,
    });
    if (!kitchenStaff) {
      return res.status(404).json({
        success: false,
        message: "Kitchen staff not found",
      });
    }

    const managerID = table.managerID;
    const waiterID = waiter._id;
    const kitchenStaffID = kitchenStaff._id;

    const order = await Order.create({
      tableID,
      managerID,
      waiterID,
      kitchenStaffID,
      orders,
      specialInstructions,
      totalAmount,
    });
    res.status(200).json({
      success: true,
      orderID: order._id,
      order,
    });
  } catch (error) {
    console.error("Detailed Error:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
    next(error);
  }
};

const updateOrderStatus = async (req, res, next) => {
  try {
    const orderID = req.params.id;

    const status = req.body.status;
    const time = req.body.time;

    const order = await Order.findById(orderID);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }
    // order.status = "confirmed";
    order.status = status || order.status;
    order.completedIn = time || order.time;
    await order.save();

    res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    console.error("Detailed Error:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
    next(error);
  }
};

const getOrderDetails = async (req, res, next) => {
  try {
    const userID = req.user._id;

    const orders = await Order.find({
      $and: [
        {
          $or: [
            { managerID: userID },
            { waiterID: userID },
            { kitchenStaffID: userID },
          ],
        },
        { status: { $ne: "ORDER READY" } },
      ],
    }).populate("managerID waiterID kitchenStaffID tableID");

    if (!orders) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Transform the orders to match the format of orderDetails from socket.io
    const transformedOrders = orders.map((order) => ({
      orderId: order._id,
      cartItems: order.orders.map((item) => ({
        _id: item._id,
        itemName: item.itemName,
        price: item.price,
        quantity: item.quantity,
      })),
      tableID: order.tableID,
      specialInstructions: order.specialInstructions,
      totalAmount: order.totalAmount,
      status: order.status,
    }));

    res.status(200).json({
      success: true,
      orders: transformedOrders,
    });
  } catch (error) {
    console.error("Detailed Error:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
    next(error);
  }
};

const getOrderDetailsToKitchen = async (req, res, next) => {
  try {
    const userID = req.user._id;

    const orders = await Order.find({
      $and: [
        {
          $or: [{ managerID: userID }, { kitchenStaffID: userID }],
        },
        { status: { $ne: "ORDER READY" } },
        { status: { $ne: "Order Received" } },
      ],
    }).populate("managerID kitchenStaffID tableID");

    if (!orders) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Transform the orders to match the format of orderDetails from socket.io
    const transformedOrders = orders.map((order) => {
      let status;
      if (order.status === "Confirmed by waiter") {
        status = "ORDER RECEIVED";
      } else if (order.status === "Order Preparation Started") {
        status = "DONE";
      } else {
        status = order.status;
      }

      return {
        orderId: order._id,
        cartItems: order.orders.map((item) => ({
          _id: item._id,
          itemName: item.itemName,
          price: item.price,
          quantity: item.quantity,
        })),
        tableID: order.tableID,
        specialInstructions: order.specialInstructions,
        totalAmount: order.totalAmount,
        status: status,
      };
    });

    res.status(200).json({
      success: true,
      orders: transformedOrders,
    });
  } catch (error) {
    console.error("Detailed Error:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
    next(error);
  }
};

const getOrderDetailsForManager = async (req, res, next) => {
  try {
    const userID = req.user._id;

    const orders = await Order.find({
      managerID: userID,
      status: { $ne: "ORDER READY" },
    }).populate("managerID waiterID kitchenStaffID tableID");

    if (!orders) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Transform the orders to match the format of orderDetails from socket.io
    const transformedOrders = orders.map((order) => ({
      orderId: order._id,
      cartItems: order.orders.map((item) => ({
        _id: item._id,
        itemName: item.itemName,
        price: item.price,
        quantity: item.quantity,
      })),
      tableID: order.tableID,
      specialInstructions: order.specialInstructions,
      totalAmount: order.totalAmount,
      status: order.status,
    }));

    res.status(200).json({
      success: true,
      orders: transformedOrders,
    });
  } catch (error) {
    console.error("Detailed Error:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
    next(error);
  }
};

module.exports = {
  menuView,
  createOrder,
  updateOrderStatus,
  getOrderDetails,
  getOrderDetailsToKitchen,
  getOrderDetailsForManager,
};
