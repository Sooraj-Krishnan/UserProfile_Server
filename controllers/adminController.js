require("dotenv").config();
const mongoose = require("mongoose");
//const nodemailer = require("nodemailer");
//const Admin = require("../models/adminModel");
const Manager = require("../models/managerModel");
const Admin = require("../models/adminModel");
//const OTPVerification = require("../models/OTPverifyModel");
const bcrypt = require("bcrypt");
//const { generateQR } = require("../helpers/qrCodeGenerator");
//const { uploadFile, deleteFile } = require("../helpers/s3");
//const crypto = require("crypto");

//const { default: mongoose } = require("mongoose");
//const { log, Console } = require("console");

//const { exec } = require("child_process");

//const QRBase = process.env.MENU_CARD_QR_URL;
//const S3Url = process.env.AWS_BUCKET_URL;

//const generateFileName = (bytes = 32) =>
//crypto.randomBytes(bytes).toString("hex");

const adminDashboard = async (req, res, next) => {
  try {
    const adminID = req.user._id;
    const admin = await Admin.findById(adminID);
    if (!admin) {
      return res
        .status(404)
        .json({ success: false, message: "Admin Not Found" });
    }
    const cardLimit = admin.cardLimit;
    const managerCount = await Manager.countDocuments({
      adminID: adminID,
      status: { $ne: "delete" },
    });

    const usedCards = await Manager.aggregate([
      { $match: { adminID: new mongoose.Types.ObjectId(adminID) } },
      { $group: { _id: null, total: { $sum: "$cardLimit" } } },
    ]);

    res.status(200).json({
      success: true,
      message: "Dashboard Fetched Successfully",
      admin,
      cardLimit,
      managerCount,
      totalUsedCards: usedCards[0] ? usedCards[0].total : 0,
    });
  } catch (error) {
    console.error(error.message);
    next(error);
  }
};

const createManager = async (req, res, next) => {
  try {
    const { name, email, password, cardLimit } = req.body;
    const hash = await bcrypt.hash(password, 10);
    const adminID = req.user._id;

    const manager = await Manager.create({
      name,
      email,
      password: hash,
      adminID,
      cardLimit,
    });

    res.status(200).json({
      success: true,
      message: "Manager Created Successfully",
      data: manager,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res
        .status(400)
        .json({ success: false, message: "Manager Email Already exists" });
    }
    next(error);
  }
};

const editManager = async (req, res, next) => {
  try {
    const managerID = req.params.id;

    // Fetch the existing feedback
    const manager = await Manager.findById(managerID);

    // Update the feedback in the database
    manager.name = req.body.name;
    manager.email = req.body.email;
    manager.cardLimit = req.body.cardLimit;
    manager.managerID = req.body.managerID;

    const updatedManager = await manager.save();

    res.status(200).json({
      update: true,
      message: "Manager updated successfully!",
      data: updatedManager,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res
        .status(400)
        .json({ success: false, message: "Manager Email Already exists" });
    }
    next(error);
  }
};

const viewManagers = async (req, res, next) => {
  try {
    const adminID = req.user._id;
    // const admin = await Admin.findById(adminID).exec();

    const managers = await Manager.find({
      adminID: adminID,
      status: { $ne: "delete" },
    }).sort({ createdDate: -1 });

    res.status(200).json({
      success: true,
      message: "Managers Fetched Successfully",
      data: managers,
    });
  } catch (error) {
    next(error);
  }
};

const blockManager = async (req, res, next) => {
  try {
    const { id } = req.params;
    const manager = await Manager.findById(id).exec();
    if (!manager)
      return res
        .status(404)
        .json({ success: false, message: "Manager Not Found" });

    // Toggle the employee status
    if (manager.status === "active") {
      await manager.updateOne({ status: "blocked" });
      return res.status(200).json({ success: true, message: "Blocked" });
    } else {
      await manager.updateOne({ status: "active" });
      return res.status(200).json({ success: true, message: "Activated" });
    }
  } catch (error) {
    next(error);
  }
};

const deleteManager = async (req, res, next) => {
  try {
    const manager = await Manager.findById(req.params.id);

    if (manager) {
      await manager.updateOne({ status: "delete" });
      res.status(200).json({ delete: true, message: "deleted" });
    }
  } catch (error) {
    console.log(error);
    next(error);
  }
};

module.exports = {
  adminDashboard,
  createManager,
  editManager,
  viewManagers,
  blockManager,
  deleteManager,
};
