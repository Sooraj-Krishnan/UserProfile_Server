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
const S3Url = process.env.AWS_BUCKET_URL;

// const generateFileName = (bytes = 32) =>
//   crypto.randomBytes(bytes).toString("hex");

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

const editAdminProfile = async (req, res, next) => {
  try {
    // Find the admin by the ID from the authenticated user
    const admin = await Admin.findById(req.user._id);

    // If no admin is found, return an error
    if (!admin) {
      return res.status(404).json({ success: false, message: "No user found" });
    }

    // Get the updated data from the request body
    const { name, email, bio, profileImageUrl, isPublic } = req.body;
    const updatedData = {
      name,
      email,
      bio,
      profileImage: profileImageUrl,
      isPublic,
    };

    // If a new password is provided, hash it before updating
    if (req.body.password) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(req.body.password, salt);
      updatedData.password = hashedPassword;
    }

    // Update the admin document with the new data
    const updatedAdmin = await Admin.findByIdAndUpdate(
      req.user._id,
      { $set: updatedData },
      { new: true }
    );

    // Send a success response with the updated admin data
    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      admin: updatedAdmin,
    });
  } catch (error) {
    // Handle any errors that occurred
    console.error("Error updating admin profile:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const viewAllUsers = async (req, res, next) => {
  try {
    const admin = await Admin.findById(req.user._id); // Find the admin user

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    if (admin.isAdmin) {
      // If the user is an admin, send back all users
      const users = await Admin.find({ _id: { $ne: req.user._id } });

      return res.status(200).json({
        success: true,
        message: "All users fetched successfully",
        users: users,
      });
    }

    // If the user is not an admin, send back all users where isPublic is true
    const users = await Admin.find({
      _id: { $ne: req.user._id },
      isPublic: true,
    });

    return res.status(200).json({
      success: true,
      message: "All public users fetched successfully",
      users: users,
    });
  } catch (err) {
    console.error("Error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
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
  editAdminProfile,
  viewAllUsers,
  createManager,
  editManager,
  viewManagers,
  blockManager,
  deleteManager,
};
